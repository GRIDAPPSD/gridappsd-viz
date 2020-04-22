import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

import { Alarms } from './Alarms';
import { StateStore } from '@shared/state-store';
import { StompClientService } from '@shared/StompClientService';
import { Alarm } from './models/Alarm';
import { NewAlarmNotification } from './views/new-alarm-notification/NewAlarmNotification';
import { SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';

interface Props {
  onNewAlarmsConfirmed: () => void;
  onLocateNodeForAlarm: (alarm: Alarm) => void;
}

interface State {
  alarms: Alarm[];
  newAlarmCounts: number;
}

export class AlarmsContainer extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _unsubscriber = new Subject<void>();

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
    this._subscribeToNewAlarmsTopic();
    this._pickAlarmsFromSimulationSnapshotStream();
    this._clearAllAlarmsWhenSimulationStarts();
  }

  private _subscribeToNewAlarmsTopic() {
    this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== '' && this._simulationControlService.didUserStartActiveSimulation()),
        map(id => `/topic/goss.gridappsd.simulation.gridappsd-alarms.${id}.output`),
        switchMap(this._stompClientService.readFrom),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: (alarms: Alarm[]) => {
          const timestamp = Date.now() / 1000;
          for (const alarm of alarms) {
            alarm.timestamp = timestamp;
          }
          this.setState({
            alarms: [...this.state.alarms, ...alarms],
            newAlarmCounts: alarms.length + this.state.newAlarmCounts
          });
          this._simulationControlService.syncSimulationSnapshotState({
            alarms
          });
        },
        error: console.error
      });
  }

  private _pickAlarmsFromSimulationSnapshotStream() {
    this._simulationControlService.selectSimulationSnapshotState('alarms')
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
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationControlService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: () => {
          this.setState({
            alarms: [],
            newAlarmCounts: 0
          });
          this._simulationControlService.syncSimulationSnapshotState({
            alarms: []
          });
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
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
