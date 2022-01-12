import { Component } from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, switchMap, takeWhile, finalize, takeUntil } from 'rxjs/operators';

import { StateStore } from '@client:common/state-store';
import { waitUntil } from '@client:common/misc';
import { SIMULATION_STATUS_LOG_TOPIC, SimulationManagementService, SimulationStatusLogMessage } from '@client:common/simulation';
import { StompClientService, StompClientConnectionStatus } from '@client:common/StompClientService';
import { SimulationStatus } from '@project:common/SimulationStatus';
import { SimulationQueue } from '@client:common/simulation';

import { Deque } from './models/Deque';
import { SimulationStatusLogger } from './SimulationStatusLogger';
import { Buffer } from './models/Buffer';
import { LogMessage } from './models/LogMessage';

interface Props {

}

interface State {
  isFetching: boolean;
  totalLogMessageCount: number;
  visibleLogMessageDeque: Deque<LogMessage>;
}

const logMessageStoreName = 'SimulationStatusLogMessageStore';
const numberOfMessagesToShow = 30;
const lowestLogMessageId = 0;

export class SimulationStatusLogContainer extends Component<Props, State> {

  visibleLogMessageDeque = new Deque<LogMessage>();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _simulationQueue = SimulationQueue.getInstance();

  private _logMessageBuffer = new Buffer<LogMessage>();
  private _nextLogMessageId = lowestLogMessageId;
  private _db: IDBDatabase = null;
  private _activeSimulationStream: Subscription = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      isFetching: false,
      totalLogMessageCount: 0,
      visibleLogMessageDeque: this.visibleLogMessageDeque
    };

    this._newObservableForLogMessages = this._newObservableForLogMessages.bind(this);
    this._onSimulationStatusLogMessageReceived = this._onSimulationStatusLogMessageReceived.bind(this);
    this.onLoadMoreMessages = this.onLoadMoreMessages.bind(this);
  }

  componentDidMount() {
    this._observeActiveSimulationChangeEvent();
    this._initializeLogMessageStore();
    this._subscribeToSimulationStatusLogMessageStream();
    this._clearAllLogMessagesWhenSimulationStarts();
  }

  private _observeActiveSimulationChangeEvent() {
    this._activeSimulationStream = this._simulationQueue.queueChanges()
      .subscribe({
        next: () => {
          this._clearMessageLogger();
        }
      });
  }

  private _clearMessageLogger() {
    this._transaction('readwrite').then(store => store.clear());
    this.visibleLogMessageDeque.clear();
    this._logMessageBuffer.clear();
    this._nextLogMessageId = lowestLogMessageId;
    this.setState({
      totalLogMessageCount: 0,
      isFetching: false,
      visibleLogMessageDeque: this.visibleLogMessageDeque
    });
  }

  private _initializeLogMessageStore() {
    indexedDB.deleteDatabase(SimulationStatusLogContainer.name).onsuccess = () => {
      const request = indexedDB.open(SimulationStatusLogContainer.name, 1);
      request.onsuccess = event => {
        this._db = (event.target as IDBOpenDBRequest).result;
      };
      request.onupgradeneeded = event => {
        this._db = (event.target as IDBOpenDBRequest).result;
        this._db.createObjectStore(logMessageStoreName, { keyPath: 'id' });
      };
    };
  }

  private _subscribeToSimulationStatusLogMessageStream() {
    this._stompClientService.statusChanges()
      .pipe(
        filter(status => status === StompClientConnectionStatus.CONNECTED),
        switchMap(() => this._stateStore.select('simulationId')),
        filter(simulationId => simulationId !== '' && this._simulationManagementService.isUserInActiveSimulation()),
        switchMap(this._newObservableForLogMessages),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: this._onSimulationStatusLogMessageReceived
      });
  }

  private _newObservableForLogMessages(simulationId: string) {
    this.setState({
      isFetching: true
    });
    return this._stompClientService.readFrom<SimulationStatusLogMessage>(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`)
      .pipe(
        takeWhile(this._simulationManagementService.isUserInActiveSimulation),
        takeUntil(this._simulationManagementService.simulationStatusChanges().pipe(filter(status => status === SimulationStatus.STOPPED))),
        takeUntil(this._unsubscriber),
        finalize(() => this._flushLogMessageBufferToObjectStoreIfNeeded(true))
      );
  }

  private _flushLogMessageBufferToObjectStoreIfNeeded(force = false) {
    if (this._logMessageBuffer.isFull() || force) {
      const buffer = this._logMessageBuffer;
      this._logMessageBuffer = new Buffer();
      this._transaction('readwrite').then(store => buffer.forEach(message => store.add(message)));
    }
  }

  private _transaction(mode: 'readonly' | 'readwrite' = 'readonly') {
    return waitUntil(() => this._db !== null)
      .then(() => this._db.transaction(logMessageStoreName, mode).objectStore(logMessageStoreName));
  }

  private _onSimulationStatusLogMessageReceived(content: SimulationStatusLogMessage) {
    const logMessage: LogMessage = {
      id: this._nextLogMessageId++,
      content
    };
    if (this.visibleLogMessageDeque.size() === numberOfMessagesToShow) {
      this.visibleLogMessageDeque.popBack();
    }
    this.visibleLogMessageDeque.pushFront(logMessage);
    this._logMessageBuffer.add(logMessage);
    this._flushLogMessageBufferToObjectStoreIfNeeded();
    this.setState(state => ({
      totalLogMessageCount: state.totalLogMessageCount + 1,
      isFetching: false
    }));
  }

  private _clearAllLogMessagesWhenSimulationStarts() {
    this._simulationManagementService.simulationStatusChanges()
      .pipe(
        filter(status => status === SimulationStatus.STARTING && this._simulationManagementService.didUserStartActiveSimulation()),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: () => {
          this._transaction('readwrite').then(store => store.clear());
          this.visibleLogMessageDeque.clear();
          this._logMessageBuffer.clear();
          this._nextLogMessageId = lowestLogMessageId;
          this.setState({
            totalLogMessageCount: 0,
            isFetching: true,
            visibleLogMessageDeque: this.visibleLogMessageDeque
          });
        }
      });
  }

  componentWillUnmount() {
    this.visibleLogMessageDeque.clear();
    this._logMessageBuffer.clear();
    this._transaction('readwrite').then(store => store.clear());
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    return (
      <SimulationStatusLogger
        totalLogMessageCount={this.state.totalLogMessageCount}
        visibleLogMessageDeque={this.state.visibleLogMessageDeque}
        showProgressIndicator={this.state.isFetching}
        onLoadMoreLogMessages={this.onLoadMoreMessages} />
    );
  }

  onLoadMoreMessages(start: number, count: number) {
    this._transaction()
      .then(store => {
        store.getAll(IDBKeyRange.lowerBound(start - count), count).onsuccess = event => {
          const logMessages = (event.target as IDBRequest).result as LogMessage[];
          if (logMessages.length > 0) {
            const messageDeque = new Deque<LogMessage>();
            for (let i = logMessages.length - 1; i > -1; i--) {
              messageDeque.pushBack(logMessages[i]);
            }
            this.visibleLogMessageDeque = messageDeque;
            this.setState({
              visibleLogMessageDeque: messageDeque
            });
          }
        };
      });
  }

}
