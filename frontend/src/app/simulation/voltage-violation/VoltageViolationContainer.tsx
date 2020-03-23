import * as React from 'react';
import { zip, Subject } from 'rxjs';
import { switchMap, map, filter, takeWhile, takeUntil, timestamp } from 'rxjs/operators';

import { VoltageViolation } from './VoltageViolation';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { DateTimeService } from '@shared/DateTimeService';

interface Props {
}

interface State {
  totalVoltageViolations: number;
  violationsAtZero: number;
  voltageViolationTimestamp: string;
}

export class VoltageViolationContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _dateTimeService = DateTimeService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      totalVoltageViolations: -1,
      violationsAtZero: 0,
      voltageViolationTimestamp: ''
    };
  }

  componentDidMount() {
    this._observeVoltageViolationChanges();
    this._readViolationsOnSimulationSnapshotReceived();
    this._clearAllViolationCountsWhenSimulationStarts();
  }

  private _observeVoltageViolationChanges() {
    return this._stateStore.select('simulationId')
      .pipe(
        filter(id => id !== '' && this._simulationControlService.didUserStartActiveSimulation()),
        switchMap(id => this._stompClientService.readFrom(`/topic/goss.gridappsd.simulation.voltage_violation.${id}.output`)),
        takeWhile(this._simulationControlService.isUserInActiveSimulation),
        map(JSON.parse as (payload: string) => { [mrid: string]: number }),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: payload => {
          const violatingValues = Object.values(payload);
          const violationsAtZero = violatingValues.filter(value => value === 0).length;
          const state = {
            totalVoltageViolations: violatingValues.length,
            violationsAtZero,
            voltageViolationTimestamp: this._dateTimeService.format(new Date())
          };
          this.setState(state);
          this._simulationControlService.syncSimulationSnapshotState(state);
        }
      });
  }

  private _readViolationsOnSimulationSnapshotReceived() {
    return zip(
      this._simulationControlService.selectSimulationSnapshotState('totalVoltageViolations'),
      this._simulationControlService.selectSimulationSnapshotState('violationsAtZero'),
      this._simulationControlService.selectSimulationSnapshotState('voltageViolationTimestamp')
    )
      .pipe(
        filter(this._simulationControlService.isUserInActiveSimulation),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: tuple => {
          this.setState({
            totalVoltageViolations: tuple[0],
            violationsAtZero: tuple[1],
            voltageViolationTimestamp: tuple[2]
          });
        }
      });
  }

  private _clearAllViolationCountsWhenSimulationStarts() {
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTED && this._simulationControlService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: () => {
          const newStates = {
            totalVoltageViolations: -1,
            violationsAtZero: -1,
            voltageViolationTimestamp: ''
          };
          this.setState(newStates);
          this._simulationControlService.syncSimulationSnapshotState(newStates);
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      this.state.totalVoltageViolations !== -1
      &&
      <VoltageViolation
        timestamp={this.state.voltageViolationTimestamp}
        totalVoltageViolations={this.state.totalVoltageViolations}
        numberOfViolationsAtZero={this.state.violationsAtZero} />
    );
  }

}
