import * as React from 'react';
import { Subscription } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';

import { VoltageViolation } from './VoltageViolation';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';

interface Props {
}

interface State {
  violationCounts: number;
}

export class VoltageViolationContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _voltageViolationSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      violationCounts: -1
    };
  }

  componentDidMount() {
    this._voltageViolationSubscription = this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== ''),
        switchMap(id => this._stompClientService.readFrom(`/topic/goss.gridappsd.simulation.voltage_violation.${id}.output`)),
        map(JSON.parse as (payload: string) => any[])
      )
      .subscribe({
        next: payload => {
          this.setState({
            // The number of objects indicates the number of voltage violations
            violationCounts: Object.keys(payload).length
          });
        }
      });
  }

  componentWillUnmount() {
    this._voltageViolationSubscription.unsubscribe();
  }

  render() {
    return (
      this.state.violationCounts !== -1
      &&
      <VoltageViolation violationCounts={this.state.violationCounts} />
    );
  }

}
