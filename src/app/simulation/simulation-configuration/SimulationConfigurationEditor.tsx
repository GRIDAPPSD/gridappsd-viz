import * as React from 'react';
import { Subscription } from 'rxjs';

import { SimulationConfiguration, SimulationControlService, SimulationStatus } from '@shared/simulation';
import { FeederModel, ModelDictionary } from '@shared/topology';
import { Application } from '@shared/Application';
import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { TabGroup, Tab } from '@shared/tabs';
import { BasicButton } from '@shared/buttons';
import { PowerSystemConfigurationFormGroup } from './views/PowerSystemConfigurationFormGroup';
import { SimulationConfigurationFormGroup } from './views/SimulationConfigurationFormGroup';
import { ApplicationConfigurationFormGroup } from './views/ApplicationConfigurationFormGroup';
import { TestConfigurationFormGroup } from './views/TestConfigurationFormGroup';
import { ModelDictionaryTracker } from './services/ModelDictionaryTracker';
import { Wait } from '@shared/wait';
import { DateTimeService } from './services/DateTimeService';
import { OutageEvent } from './models/OutageEvent';
import { FaultEvent } from './models/FaultEvent';

import './SimulationConfigurationEditor.scss';

interface Props {
  onSubmit: (configObject: SimulationConfiguration) => void;
  onMRIDChanged: (mRID: string, simulationName: string) => void;
  onClose: (event) => void;
  initialConfig: SimulationConfiguration;
  feederModels: FeederModel;
  availableApplications: Application[];
}

interface State {
  show: boolean;
  applicationConfigStr: string;
  simulationName: string;
  noLineNameMessage: boolean;
  modelDictionary: ModelDictionary;
  disableSubmitButton: boolean;
}

export class SimulationConfigurationEditor extends React.Component<Props, State> {

  readonly currentConfig: SimulationConfiguration;
  readonly simulationStartDate = new Date();
  readonly dateTimeService = DateTimeService.getInstance();

  outageEvents: OutageEvent[];
  faultEvents: FaultEvent[];

  private readonly _modelDictionaryTracker = ModelDictionaryTracker.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();

  private _subscription: Subscription;
  private _simulationStatusSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      applicationConfigStr: '',
      simulationName: props.initialConfig.simulation_config.simulation_name,
      noLineNameMessage: false,
      modelDictionary: null,
      disableSubmitButton: true
    };
    this.currentConfig = this._cloneConfigObject(props.initialConfig);
  }

  private _cloneConfigObject(original: SimulationConfiguration): SimulationConfiguration {
    const config = {} as SimulationConfiguration;
    config.power_system_config = { ...original.power_system_config };
    config.application_config = {
      applications: original.application_config.applications.length > 0 ?
        [{ ...original.application_config.applications[0] }] : [{ name: '', config_string: '' }]
    };
    config.simulation_config = {
      ...original.simulation_config,
      start_time: this.dateTimeService.format(this.simulationStartDate)
    };
    config.test_config = {
      events: original.test_config.events.map(event => Object.assign({}, event)),
      appId: original.test_config.appId
    };
    return config;
  }

  componentDidMount() {
    this._subscription = this._modelDictionaryTracker.changes()
      .subscribe({
        next: modelDictionary => this.setState({ modelDictionary: modelDictionary })
      });
    this._simulationStatusSubscription = this._simulationControlService.statusChanges()
      .subscribe({
        next: status => this.setState({
          disableSubmitButton: status !== SimulationStatus.NEW && status !== SimulationStatus.STOPPED
        })
      });
  }

  componentWillUnmount() {
    this._subscription.unsubscribe();
    this._simulationStatusSubscription.unsubscribe();
  }

  render() {
    return (
      <Dialog show={this.state.show}>
        <DialogContent>
          <form className='simulation-configuration-form'>
            <TabGroup>
              <Tab label='Power System Configuration'>
                <PowerSystemConfigurationFormGroup
                  feederModels={
                    this.props.feederModels
                  }
                  onChange={formValue => {
                    const currentPowerSystemConfig = this.currentConfig.power_system_config;
                    currentPowerSystemConfig.GeographicalRegion_name = formValue.geographicalRegionId;
                    currentPowerSystemConfig.SubGeographicalRegion_name = formValue.subGeographicalRegionId;
                    if (currentPowerSystemConfig.Line_name !== formValue.lineName) {
                      currentPowerSystemConfig.Line_name = formValue.lineName;
                      this.currentConfig.simulation_config.simulation_name = formValue.simulationName;
                      this.props.onMRIDChanged(formValue.lineName, formValue.simulationName);
                    }
                    if (formValue.lineName)
                      this.setState({
                        disableSubmitButton: false
                      });
                  }} />
              </Tab>
              <Tab label='Simulation Configuration'>
                <SimulationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  onChange={formValue => {
                    this.currentConfig.simulation_config.start_time = formValue.startTime;
                    this.currentConfig.simulation_config.duration = formValue.duration;
                    this.currentConfig.simulation_config.simulator = formValue.simulator;
                    this.currentConfig.simulation_config.run_realtime = formValue.runInRealtime;
                    this.currentConfig.simulation_config.simulation_name = formValue.simulationName;
                    this.currentConfig.simulation_config.model_creation_config = formValue.modelCreationConfig;
                  }} />
              </Tab>
              <Tab label='Application Configuration'>
                <ApplicationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  availableApplications={this.props.availableApplications}
                  onChange={formValue => {
                    const selectedApplication = this.currentConfig.application_config.applications.pop();
                    selectedApplication.name = formValue.applicationId;
                    selectedApplication.config_string = formValue.configString;
                    this.currentConfig.application_config.applications.push(selectedApplication);
                  }} />
              </Tab>
              <Tab label='Test Configuration'>
                {
                  this.state.modelDictionary
                    ? <TestConfigurationFormGroup
                      modelDictionary={this.state.modelDictionary}
                      simulationStartDate={this.dateTimeService.format(this.simulationStartDate)}
                      simulationStopDate={this.dateTimeService.format(this.calculateSimulationStopTime())}
                      onEventsAdded={events => {
                        this.outageEvents = events.outage;
                        this.faultEvents = events.fault;
                        console.log(this.outageEvents, this.faultEvents);
                      }} />
                    : <Wait show={true} />
                }
              </Tab>
            </TabGroup>
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            label='Close'
            type='negative'
            onClick={event => {
              event.stopPropagation();
              this.props.onClose(event);
              this.setState({ show: false });
            }} />
          <BasicButton
            label='Submit'
            type='positive'
            disabled={this.state.disableSubmitButton}
            onClick={event => {
              if (this.currentConfig.power_system_config.Line_name === '') {
                console.log('No model selected');
                this.setState({ noLineNameMessage: true });
              }
              else {
                event.stopPropagation();
                this.setState({ show: false });
                this.currentConfig.test_config.appId = this.currentConfig.application_config.applications[0].name;
                this.props.onSubmit(this.currentConfig);
              }
            }} />
          {this.state.noLineNameMessage &&
            <span style={{ color: 'red' }} >&nbsp; Please select a Line Name </span>}
        </DialogActions>
      </Dialog>
    );
  }

  calculateSimulationStopTime() {
    return +this.currentConfig.simulation_config.duration * 1000 + this.simulationStartDate.getTime();
  }

}
