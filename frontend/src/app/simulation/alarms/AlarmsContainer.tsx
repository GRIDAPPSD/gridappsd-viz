import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

import { Alarms } from './Alarms';
import { StateStore } from '@shared/state-store';
import { StompClientService } from '@shared/StompClientService';
import { Alarm } from './models/Alarm';
import { NewAlarmNotification } from './views/new-alarm-notification/NewAlarmNotification';
import { SimulationControlService } from '@shared/simulation';

interface Props {
  onNewAlarmsConfirmed: () => void;
}

interface State {
  alarms: Alarm[];
  newAlarmCounts: number;
}

export class AlarmsContainer extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();

  private _newAlarmsSubscription: Subscription;
  private _simulationTimeStepReceivedSubscription: Subscription;

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
    this._newAlarmsSubscription = this._subscribeToNewAlarmsTopic();
    this._simulationTimeStepReceivedSubscription = this._pickAlarmsFromSimulationSnapshotStream();
  }

  private _subscribeToNewAlarmsTopic() {
    return this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== '' && this._simulationControlService.didUserStartActiveSimulation()),
        // We got a new simulation ID which means
        // a new simulation was started
        // so reset the list of alarms to empty
        // as well as the number of current alarms
        tap(() => {
          this.setState({
            alarms: [],
            newAlarmCounts: 0
          });
        }),
        map(id => `/topic/goss.gridappsd.simulation.gridappsd-alarms.${id}.output`),
        switchMap(this._stompClientService.readFrom),
        map(JSON.parse as (str: string) => Alarm[])
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
          this._simulationControlService.syncSimulationSnapshotState({
            alarms
          });
        },
        error: console.error
      });
  }

  private _pickAlarmsFromSimulationSnapshotStream() {
    return this._simulationControlService.selectSimulationSnapshotState('alarms')
      .subscribe({
        next: (alarms: Alarm[]) => {
          this.setState({
            alarms: [...this.state.alarms, ...alarms],
            newAlarmCounts: alarms.length + this.state.newAlarmCounts
          });
        }
      });
  }

  componentWillUnmount() {
    this._newAlarmsSubscription.unsubscribe();
    this._simulationTimeStepReceivedSubscription.unsubscribe();
  }

  render() {
    if (this.state.alarms.length === 0)
      return null;
    return (
      <>
        <Alarms
          alarms={this.state.alarms}
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
