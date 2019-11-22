import * as React from 'react';
import { Subscription } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';

import { VoltageViolation } from './VoltageViolation';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';

interface Props {
}

interface State {
  totalVoltageViolations: number;
  violationsAtZero: number;
}

export class VoltageViolationContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _voltageViolationSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      totalVoltageViolations: -1,
      violationsAtZero: 0
    };
  }

  componentDidMount() {
    this._voltageViolationSubscription = this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== ''),
        switchMap(id => this._stompClientService.readFrom(`/topic/goss.gridappsd.simulation.voltage_violation.${id}.output`)),
        map(JSON.parse as (payload: string) => { [mrid: string]: number })
      )
      .subscribe({
        next: payload => {
          const violatingValues = Object.values(payload);
          this.setState({
            totalVoltageViolations: violatingValues.length,
            violationsAtZero: violatingValues.filter(value => value === 0).length
          });
        }
      });
  }

  componentWillUnmount() {
    this._voltageViolationSubscription.unsubscribe();
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
