import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SimulationConfiguration, SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { FeederModel, ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { Application } from '@shared/Application';
import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { TabGroup, Tab } from '@shared/tabs';
import { BasicButton } from '@shared/buttons';
import { PowerSystemConfigurationTab } from './views/power-system-configuration-tab';
import { SimulationConfigurationTab } from './views/simulation-configuration-tab';
import { ApplicationConfigurationTab } from './views/application-configuration-tab';
import { TestConfigurationTab } from './views/test-configuration-tab';
import { DateTimeService } from '@shared/DateTimeService';
import { FaultEvent, FaultKind, CommOutageEvent, CommandEvent } from '@shared/test-manager';
import { PowerSystemConfigurationModel } from './models/PowerSystemConfigurationModel';
import { SimulationConfigurationTabModel } from './models/SimulationConfigurationTabModel';
import { ApplicationConfigurationModel } from './models/ApplicationConfigurationModel';
import { StateStore } from '@shared/state-store';
import { ThreeDots } from '@shared/three-dots';
import { MessageBanner } from '@shared/message-banner';
import { ServiceConfigurationTab } from './views/service-configuration-tab';
import { Service } from '@shared/Service';
import { ServiceConfigurationEntryModel } from './models/ServiceConfigurationEntryModel';

import './SimulationConfigurationEditor.light.scss';
import './SimulationConfigurationEditor.dark.scss';

interface Props {
  onSubmit: (configObject: SimulationConfiguration) => void;
  onMRIDChanged: (mRID: string) => void;
  onClose: () => void;
  initialConfig: SimulationConfiguration;
  feederModel: FeederModel;
  availableApplications: Application[];
}

interface State {
  show: boolean;
  applicationConfigStr: string;
  simulationName: string;
  modelDictionary: ModelDictionary;
  disableSubmitButton: boolean;
  lineName: string;
  componentsWithGroupedPhases: ModelDictionaryComponent[];
  services: Service[];
}

export class SimulationConfigurationEditor extends React.Component<Props, State> {

  readonly currentConfig: SimulationConfiguration;
  readonly simulationStartDate = Date.now() / 1000;
  readonly dateTimeService = DateTimeService.getInstance();

  outageEvents: CommOutageEvent[] = [];
  faultEvents: FaultEvent[] = [];
  commandEvents: CommandEvent[] = [];

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      applicationConfigStr: '',
      simulationName: props.initialConfig.simulation_config.simulation_name,
      modelDictionary: null,
      disableSubmitButton: true,
      lineName: props.initialConfig.power_system_config.Line_name,
      componentsWithGroupedPhases: [],
      services: []
    };

    this.currentConfig = this._cloneConfigObject(props.initialConfig);

    this.onPowerSystemConfigurationChanged = this.onPowerSystemConfigurationChanged.bind(this);
    this.onSimulationConfigurationChanged = this.onSimulationConfigurationChanged.bind(this);
    this.onApplicationConfigurationChanged = this.onApplicationConfigurationChanged.bind(this);
    this.onTestConfigurationEventsAdded = this.onTestConfigurationEventsAdded.bind(this);
    this.onServiceConfigurationsChanged = this.onServiceConfigurationsChanged.bind(this);
    this.onServiceConfigurationValidationChanged = this.onServiceConfigurationValidationChanged.bind(this);
    this.closeForm = this.closeForm.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  private _cloneConfigObject(original: SimulationConfiguration): SimulationConfiguration {
    return {
      power_system_config: {
        ...original.power_system_config
      },
      application_config: {
        applications: original.application_config.applications.length > 0 ?
          [{ ...original.application_config.applications[0] }] : []
      },
      simulation_config: {
        ...original.simulation_config,
        start_time: this.dateTimeService.format(this.simulationStartDate)
      },
      test_config: {
        events: original.test_config.events.map(event => Object.assign({}, event)),
        appId: original.test_config.appId
      },
      service_configs: [
        ...original.service_configs
      ]
    };
  }

  componentDidMount() {
    this._stateStore.select('modelDictionary')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: modelDictionary => this.setState({ modelDictionary })
      });

    this._simulationControlService.statusChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: status => this.setState({
          disableSubmitButton: status !== SimulationStatus.STOPPED
        })
      });

    this._stateStore.select('modelDictionaryComponentsWithGroupedPhases')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: components => this.setState({
          componentsWithGroupedPhases: components
        })
      });

    this._stateStore.select('services')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: services => this.setState({
          services
        })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <Dialog show={this.state.show}>
        <DialogContent>
          <form className='simulation-configuration-form'>
            <TabGroup>
              <Tab label='Power System Configuration'>
                <PowerSystemConfigurationTab
                  powerSystemConfig={this.currentConfig.power_system_config}
                  feederModel={this.props.feederModel}
                  onChange={this.onPowerSystemConfigurationChanged} />
              </Tab>
              <Tab label='Simulation Configuration'>
                <SimulationConfigurationTab
                  simulationConfig={this.currentConfig.simulation_config}
                  simulationName={this.state.simulationName}
                  onChange={this.onSimulationConfigurationChanged} />
              </Tab>
              <Tab label='Application Configuration'>
                <ApplicationConfigurationTab
                  applicationConfig={this.currentConfig.application_config}
                  availableApplications={this.props.availableApplications}
                  onChange={this.onApplicationConfigurationChanged} />
              </Tab>
              <Tab label='Test Configuration'>
                {this.showCurrentComponentForTestConfigurationTab()}
              </Tab>
              <Tab label='Service Configuration'>
                <ServiceConfigurationTab
                  services={this.state.services}
                  onChange={this.onServiceConfigurationsChanged}
                  onValidationChange={this.onServiceConfigurationValidationChanged} />
              </Tab>
            </TabGroup>
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            label='Close'
            type='negative'
            onClick={this.closeForm} />
          <BasicButton
            label='Submit'
            type='positive'
            disabled={this.state.disableSubmitButton}
            onClick={this.submitForm} />
        </DialogActions>
      </Dialog>
    );
  }

  onPowerSystemConfigurationChanged(formValue: PowerSystemConfigurationModel) {
    if (formValue.isValid) {
      const currentPowerSystemConfig = this.currentConfig.power_system_config;
      currentPowerSystemConfig.GeographicalRegion_name = formValue.regionId;
      currentPowerSystemConfig.SubGeographicalRegion_name = formValue.subregionId;
      currentPowerSystemConfig.Line_name = formValue.lineId;
      this.currentConfig.simulation_config.simulation_name = formValue.simulationName;
      this.setState({
        simulationName: formValue.simulationName
      });
      if (formValue.lineId !== '')
        this.props.onMRIDChanged(formValue.lineId);
    }
    this.setState({
      lineName: formValue.lineId,
      disableSubmitButton: formValue.lineId === '' || !formValue.isValid
    });
  }

  onSimulationConfigurationChanged(formValue: SimulationConfigurationTabModel) {
    if (formValue.isValid) {
      this.currentConfig.simulation_config.start_time = formValue.startDateTime;
      this.currentConfig.simulation_config.duration = formValue.duration;
      this.currentConfig.simulation_config.simulator = formValue.simulator;
      this.currentConfig.simulation_config.run_realtime = formValue.runInRealtime;
      if (formValue.simulationName.includes('[NEW]'))
        this.currentConfig.simulation_config.simulation_name = formValue.simulationName.replace('[NEW]', '');
      this.currentConfig.simulation_config.model_creation_config = formValue.modelCreationConfig;
    }
    this.setState(prevState => ({
      disableSubmitButton: prevState.lineName === '' || !formValue.isValid
    }));
  }

  onApplicationConfigurationChanged(formValue: ApplicationConfigurationModel) {
    if (formValue.applicationId !== '') {
      const selectedApplication = this.currentConfig.application_config.applications.pop() || { name: '', config_string: '' };
      selectedApplication.name = formValue.applicationId;
      selectedApplication.config_string = formValue.configString;
      this.currentConfig.application_config.applications.push(selectedApplication);
    } else {
      this.currentConfig.application_config.applications.pop();
    }
  }

  showCurrentComponentForTestConfigurationTab() {
    if (this.state.lineName === '') {
      return (
        <MessageBanner>
          Please select a line name
        </MessageBanner>
      );
    }
    if (!this.state.modelDictionary) {
      return (
        <MessageBanner>
          Fetching model dictionary
          <ThreeDots />
        </MessageBanner>
      );
    }
    return (
      <TestConfigurationTab
        modelDictionary={this.state.modelDictionary}
        simulationStartTime={this.simulationStartDate}
        simulationStopTime={+this.currentConfig.simulation_config.duration + this.simulationStartDate}
        componentWithConsolidatedPhases={this.state.componentsWithGroupedPhases}
        onEventsAdded={this.onTestConfigurationEventsAdded} />
    );
  }

  onTestConfigurationEventsAdded(payload: { outageEvents: CommOutageEvent[]; faultEvents: FaultEvent[]; commandEvents: CommandEvent[]; }) {
    this.outageEvents = payload.outageEvents;
    this.faultEvents = payload.faultEvents;
    this.commandEvents = payload.commandEvents;
  }

  onServiceConfigurationsChanged(serviceConfigurationEntryModels: ServiceConfigurationEntryModel[]) {
    this.currentConfig.service_configs = serviceConfigurationEntryModels.map(model => ({
      id: model.service.id,
      user_options: model.values
    }));
  }

  onServiceConfigurationValidationChanged(isValid: boolean) {
    this.setState({
      disableSubmitButton: this.state.lineName === '' || !isValid
    });
  }

  closeForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.props.onClose();
    this.setState({
      show: false
    });
  }

  submitForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.setState({
      show: false
    });
    const selectedApplication = this.currentConfig.application_config.applications[0];
    this.currentConfig.test_config.appId = selectedApplication ? selectedApplication.name : '';
    for (const outageEvent of this.outageEvents)
      this.currentConfig.test_config.events.push(this._transformOutageEventForSubmission(outageEvent));
    for (const faultEvent of this.faultEvents)
      this.currentConfig.test_config.events.push(this._transformFaultEventForSubmission(faultEvent));
    for (const commandEvent of this.commandEvents)
      this.currentConfig.test_config.events.push(commandEvent);
    this._stateStore.update({
      faultEvents: this.faultEvents,
      outageEvents: this.outageEvents,
      commandEvents: this.commandEvents
    });
    this.props.onSubmit(this.currentConfig);
  }

  private _transformOutageEventForSubmission(outageEvent: CommOutageEvent) {
    return {
      allInputOutage: outageEvent.allInputOutage,
      allOutputOutage: outageEvent.allOutputOutage,
      inputOutageList: this._flattenArray(outageEvent.inputList.map(inputItem => {
        if (Array.isArray(inputItem.mRID))
          return inputItem.phases.map(phase => ({
            objectMRID: inputItem.mRID[phase.phaseIndex],
            attribute: inputItem.attribute
          }));
        return {
          objectMRID: inputItem.mRID,
          attribute: inputItem.attribute
        };
      })),
      outputOutageList: outageEvent.outputList.map(outputItem => outputItem.mRID),
      event_type: outageEvent.event_type,
      occuredDateTime: outageEvent.startDateTime,
      stopDateTime: outageEvent.stopDateTime
    };
  }

  private _transformFaultEventForSubmission(faultEvent: FaultEvent) {
    return {
      PhaseConnectedFaultKind: faultEvent.faultKind,
      FaultImpedance: this._getImpedance(faultEvent),
      ObjectMRID: Array.isArray(faultEvent.mRID)
        ? [...new Set(faultEvent.phases.map(phase => faultEvent.mRID[phase.phaseIndex]))]
        : [faultEvent.mRID],
      phases: faultEvent.phases.map(phase => phase.phaseLabel).join(''),
      event_type: faultEvent.event_type,
      occuredDateTime: faultEvent.startDateTime,
      stopDateTime: faultEvent.stopDateTime
    };
  }

  private _getImpedance(faultEvent: FaultEvent) {
    if (faultEvent.faultKind === FaultKind.LINE_TO_GROUND)
      return {
        xGround: faultEvent.FaultImpedance.xGround,
        rGround: faultEvent.FaultImpedance.rGround
      };
    if (faultEvent.faultKind === FaultKind.LINE_TO_LINE)
      return {
        xLineToLine: faultEvent.FaultImpedance.xLineToLine,
        rLineToLine: faultEvent.FaultImpedance.rLinetoLine
      };
    return {
      xGround: faultEvent.FaultImpedance.xGround,
      rGround: faultEvent.FaultImpedance.rGround,
      xLineToLine: faultEvent.FaultImpedance.xLineToLine,
      rLineToLine: faultEvent.FaultImpedance.rLinetoLine
    };
  }

  private _flattenArray(array: any[]) {
    const result = [];
    for (const element of array) {
      if (Array.isArray(element))
        result.push(...element);
      else
        result.push(element);
    }
    return result;
  }

}
