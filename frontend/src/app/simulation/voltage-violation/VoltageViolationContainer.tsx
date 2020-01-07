import * as React from 'react';
import { Subscription, zip } from 'rxjs';
import { switchMap, map, filter, tap, takeWhile } from 'rxjs/operators';

import { VoltageViolation } from './VoltageViolation';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { SimulationControlService } from '@shared/simulation';

interface Props {
}

interface State {
  totalVoltageViolations: number;
  violationsAtZero: number;
}

export class VoltageViolationContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _voltageViolationSubscription: Subscription;
  private _simulationSnapshotSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      totalVoltageViolations: -1,
      violationsAtZero: 0
    };
  }

  componentDidMount() {
    this._voltageViolationSubscription = this._observeVoltageViolationChanges();
    this._simulationSnapshotSubscription = this._readViolationsOnSimulationSnapshotReceived();
  }

  private _observeVoltageViolationChanges() {
    return this._stateStore.select('simulationId')
      .pipe(
        tap(() => {
          this.setState({
            totalVoltageViolations: -1,
            violationsAtZero: -1
          });
        }),
        filter(id => id !== '' && this._simulationControlService.didUserStartActiveSimulation()),
        switchMap(id => this._stompClientService.readFrom(`/topic/goss.gridappsd.simulation.voltage_violation.${id}.output`)),
        takeWhile(this._simulationControlService.isUserInActiveSimulation),
        map(JSON.parse as (payload: string) => { [mrid: string]: number })
      )
      .subscribe({
        next: payload => {
          const violatingValues = Object.values(payload);
          const violationsAtZero = violatingValues.filter(value => value === 0).length;
          this.setState({
            totalVoltageViolations: violatingValues.length,
            violationsAtZero
          });
          this._simulationControlService.syncSimulationSnapshotState({
            totalVoltageViolations: violatingValues.length,
            violationsAtZero
          });
        }
      });
  }

  private _readViolationsOnSimulationSnapshotReceived() {
    return zip(
      this._simulationControlService.selectSimulationSnapshotState('totalVoltageViolations'),
      this._simulationControlService.selectSimulationSnapshotState('violationsAtZero')
    )
      .pipe(filter(this._simulationControlService.isUserInActiveSimulation))
      .subscribe({
        next: tuple => {
          this.setState({
            totalVoltageViolations: tuple[0],
            violationsAtZero: tuple[1]
          });
        }
      });
  }

  componentWillUnmount() {
    this._voltageViolationSubscription.unsubscribe();
    this._simulationSnapshotSubscription.unsubscribe();
  }

  render() {
    return (
      this.state.totalVoltageViolations !== -1
      &&
      <div className='voltage-violations'>
        <VoltageViolation
          label='Total voltage violations'
          violationCounts={this.state.totalVoltageViolations} />

        <VoltageViolation
          label='Violations at 0'
          violationCounts={this.state.violationsAtZero} />
      </div>
    );
  }

}
