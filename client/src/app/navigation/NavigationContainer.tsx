import { Component } from 'react';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { StateStore } from '@client:common/state-store';
import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { StompClientConnectionStatus, StompClientService } from '@client:common/StompClientService';
import {
  Simulation,
  SimulationQueue,
  SimulationConfiguration
  // FieldModelSimulationConfiguration
} from '@client:common/simulation';
import { ConfigurationManager } from '@client:common/ConfigurationManager';
import { FilePickerService } from '@client:common/file-picker';
import { Notification } from '@client:common/overlay/notification';

import { Navigation } from './Navigation';

interface Props {
  fieldModelMrid: string;
  onShowSimulationConfigForm: (config: SimulationConfiguration, isUploaded: boolean) => void;
  // onShowFieldModelSimulationConfigForm: (config: FieldModelSimulationConfiguration) => void;
  onLogout: () => void;
  onJoinActiveSimulation: (simulationId: string) => void;
  onShowExpectedResultViewer: () => void;
}

interface State {
  previousSimulations: Simulation[];
  version: string;
  stompClientConnectionStatus: StompClientConnectionStatus;
  activeSimulationIds: string[];

}

export class NavigationContainer extends Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _configurationManager = ConfigurationManager.getInstance();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _filePickerService = FilePickerService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      previousSimulations: this._simulationQueue.getAllSimulations().filter(e => e.didRun),
      stompClientConnectionStatus: this._stompClientService.isActive() ? StompClientConnectionStatus.CONNECTED : StompClientConnectionStatus.CONNECTING,
      version: '',
      activeSimulationIds: []
    };

    this.onSelectExpectedResultComparisonType = this.onSelectExpectedResultComparisonType.bind(this);
    this.onShowUploadSimulationConfigFile = this.onShowUploadSimulationConfigFile.bind(this);
  }

  componentDidMount() {
    this._subscribeToActiveSimulationIdsStateStoreChange();
    this._subscribeToAllSimulationQueueStream();
    this._subscribeToStompClientStatusChanges();
    this._subscribeToConfigurationChanges();
  }

  private _subscribeToActiveSimulationIdsStateStoreChange() {
    return this._stateStore.select('activeSimulationIds')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: activeSimulationIds => this.setState({ activeSimulationIds })
      });
  }

  private _subscribeToAllSimulationQueueStream(): Subscription {
    return this._simulationQueue.queueChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        map(simulations => simulations.filter(simulation => simulation.didRun))
      )
      .subscribe({
        next: simulations => this.setState({ previousSimulations: simulations })
      });
  }

  private _subscribeToStompClientStatusChanges() {
    this._stompClientService.statusChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: state => this.setState({ stompClientConnectionStatus: state })
      });
  }

  private _subscribeToConfigurationChanges() {
    this._configurationManager.configurationChanges('version')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: version => this.setState({ version })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <Navigation
        fieldModelMrid={this.props.fieldModelMrid}
        version={this.state.version}
        stompClientConnectionStatus={this.state.stompClientConnectionStatus}
        previousSimulations={this.state.previousSimulations}
        activeSimulationIds={this.state.activeSimulationIds}
        onShowSimulationConfigForm={this.props.onShowSimulationConfigForm}
        // onShowFieldModelSimulationConfigForm={this.props.onShowFieldModelSimulationConfigForm}
        onShowUploadSimulationConfigFile={this.onShowUploadSimulationConfigFile}
        onLogout={this.props.onLogout}
        onJoinActiveSimulation={this.props.onJoinActiveSimulation}
        onSelectExpectedResultComparisonType={this.onSelectExpectedResultComparisonType}>
        {this.props.children}
      </Navigation>
    );
  }

  onSelectExpectedResultComparisonType(selectedType: ExpectedResultComparisonType) {
    this._stateStore.update({
      expectedResultComparisonType: selectedType
    });
    this.props.onShowExpectedResultViewer();
  }

  onShowUploadSimulationConfigFile() {
    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: fileContent => {
          this.props.onShowSimulationConfigForm(fileContent, true);
          this._filePickerService.clearSelection();
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this._filePickerService.clearSelection();
        }
      });
  }
}
