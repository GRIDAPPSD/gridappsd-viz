import { Component } from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

import { StateStore } from '@client:common/state-store';
import { StompClientService } from '@client:common/StompClientService';
import { SimulationManagementService } from '@client:common/simulation';
import { SimulationStatus } from '@project:common/SimulationStatus';
import { SimulationQueue } from '@client:common/simulation';

import { Alarm } from './models/Alarm';
import { NewAlarmNotification } from './views/new-alarm-notification/NewAlarmNotification';
import { Alarms } from './Alarms';

interface Props {
  onNewAlarmsConfirmed: () => void;
  onLocateNodeForAlarm: (alarm: Alarm) => void;
}

interface State {
  alarms: Alarm[];
  newAlarmCounts: number;
}

export class AlarmsContainer extends Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _simulationQueue = SimulationQueue.getInstance();


  private _activeSimulationStream: Subscription = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      alarms: [],
      newAlarmCounts: 0
    };

    this.acknowledgeAlarm = this.acknowledgeAlarm.bind(this);
    this.confirmNewAlarms = this.confirmNewAlarms.bind(this);
  }

  componentDidMount() {
    this._observeActiveSimulationChangeEvent();
    this._subscribeToNewAlarmsTopic();
    this._pickAlarmsFromSimulationSnapshotStream();
    this._clearAllAlarmsWhenSimulationStarts();
    this._updateAlarmTimeStampsWhenTimeZoneChanges();
  }

  private _observeActiveSimulationChangeEvent() {
    this._activeSimulationStream = this._simulationQueue.queueChanges()
      .subscribe({
        next: () => {
          this._clearAlarms();
        }
      });
  }

  private _clearAlarms() {
    this.setState({
      alarms: [],
      newAlarmCounts: 0
    });
    this._simulationManagementService.syncSimulationSnapshotState({
      alarms: []
    });
  }

  private _subscribeToNewAlarmsTopic() {
    this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== '' && this._simulationManagementService.didUserStartActiveSimulation()),
        switchMap(id => this._stompClientService.readFrom<Alarm[]>(`/topic/goss.gridappsd.simulation.gridappsd-alarms.${id}.output`)),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: alarms => {
          const timestamp = Date.now() / 1000;
          for (const alarm of alarms) {
            alarm.timestamp = timestamp;
          }
          this.setState({
            alarms: [...this.state.alarms, ...alarms],
            newAlarmCounts: alarms.length + this.state.newAlarmCounts
          });
          this._simulationManagementService.syncSimulationSnapshotState({
            alarms
          });
        },
        // eslint-disable-next-line no-console
        error: console.error
      });
  }

  private _pickAlarmsFromSimulationSnapshotStream() {
    this._simulationManagementService.selectSimulationSnapshotState('alarms')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: (alarms: Alarm[]) => {
          this.setState({
            alarms: [...this.state.alarms, ...alarms],
            newAlarmCounts: alarms.length + this.state.newAlarmCounts
          });
        }
      });
  }

  private _clearAllAlarmsWhenSimulationStarts() {
    this._simulationManagementService.simulationStatusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationManagementService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: () => {
          this.setState({
            alarms: [],
            newAlarmCounts: 0
          });
          this._simulationManagementService.syncSimulationSnapshotState({
            alarms: []
          });
        }
      });
  }

  private _updateAlarmTimeStampsWhenTimeZoneChanges() {
    this._stateStore.select('timeZone')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: () => {
          if (this.state.alarms.length > 0) {
            this.setState({
              alarms: [...this.state.alarms]
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    return (
      <>
        <Alarms
          alarms={this.state.alarms}
          onLocateNodeForAlarm={this.props.onLocateNodeForAlarm}
          onAcknowledgeAlarm={this.acknowledgeAlarm} />
        <NewAlarmNotification
          newAlarmCounts={this.state.newAlarmCounts}
          onConfirm={this.confirmNewAlarms} />
      </>
    );
  }

  acknowledgeAlarm(alarm: Alarm) {
    this.setState({
      alarms: this.state.alarms.filter(e => e !== alarm)
    });
  }

  confirmNewAlarms() {
    this.setState({
      newAlarmCounts: 0
    });
    this.props.onNewAlarmsConfirmed();
  }

}
