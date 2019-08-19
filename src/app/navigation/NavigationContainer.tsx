import * as React from 'react';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Navigation } from './Navigation';
import { Simulation, SimulationQueue, SimulationConfiguration } from '@shared/simulation';
import { StompClientConnectionStatus, StompClientService } from '@shared/StompClientService';
import { ConfigurationManager } from '@shared/ConfigurationManager';
import { AuthenticationService } from '@shared/authentication';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfiguration) => void;
}

interface State {
  previousSimulations: Simulation[];
  websocketStatus: StompClientConnectionStatus;
  version: string;
}

export class NavigationContainer extends React.Component<Props, State> {

  readonly authenticationService = AuthenticationService.getInstance();

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _configurationManager = ConfigurationManager.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      previousSimulations: this._simulationQueue.getAllSimulations(),
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'CONNECTING',
      version: ''
    };

  }

  componentDidMount() {
    this._subscribeToAllSimulationsQueueSteam();
    this._subscribeToStompClientStatusChanges();
    this._subscribeToConfigurationChanges();
  }

  private _subscribeToAllSimulationsQueueSteam(): Subscription {
    return this._simulationQueue.queueChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: simulations => this.setState({ previousSimulations: simulations })
      });
  }

  private _subscribeToStompClientStatusChanges() {
    this._stompClientService.statusChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: state => this.setState({ websocketStatus: state })
      });
  }

  private _subscribeToConfigurationChanges() {
    this._configurationManager.configurationChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: configurations => this.setState({ version: configurations.version })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <Navigation
        version={this.state.version}
        websocketStatus={this.state.websocketStatus}
        previousSimulations={this.state.previousSimulations}
        onShowSimulationConfigForm={this.props.onShowSimulationConfigForm}
        onLogout={this.authenticationService.logout} />
    );
  }

}
