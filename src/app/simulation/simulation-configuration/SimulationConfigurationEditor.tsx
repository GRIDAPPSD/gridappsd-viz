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
import { Wait } from '@shared/wait';
import { DateTimeService } from './services/DateTimeService';
import { CommOutageEvent } from '../../shared/test-manager/CommOutageEvent';
import { FaultEvent, FaultKind } from '../../shared/test-manager/FaultEvent';
import { PowerSystemConfigurationFormGroupValue } from './models/PowerSystemConfigurationFormGroupValue';
import { SimulationConfigurationFormGroupValue } from './models/SimulationConfigurationFormGroupValue';
import { ApplicationConfigurationFormGroupValue } from './models/ApplicationConfigurationFormGroupValue';
import { StateStore } from '@shared/state-store';
import { ThreeDots } from '@shared/three-dots';
import { NotificationBanner } from '@shared/notification-banner';

import './SimulationConfigurationEditor.scss';

interface Props {
  onSubmit: (configObject: SimulationConfiguration) => void;
  onMRIDChanged: (mRID: string, simulationName: string) => void;
  onClose: (event) => void;
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
}

export class SimulationConfigurationEditor extends React.Component<Props, State> {

  readonly currentConfig: SimulationConfiguration;
  readonly simulationStartDate = new Date();
  readonly dateTimeService = DateTimeService.getInstance();
  outageEvents: CommOutageEvent[] = [];
  faultEvents: FaultEvent[] = [];

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _modelDictionarySubscription: Subscription;
  private _simulationStatusSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      applicationConfigStr: '',
      simulationName: props.initialConfig.simulation_config.simulation_name,
      modelDictionary: null,
      disableSubmitButton: true,
      lineName: props.initialConfig.power_system_config.Line_name
    };

    this.currentConfig = this._cloneConfigObject(props.initialConfig);

    this.onPowerSystemConfigurationFormGroupValueChanged = this.onPowerSystemConfigurationFormGroupValueChanged.bind(this);
    this.onSimulationConfigurationFormGroupValueChanged = this.onSimulationConfigurationFormGroupValueChanged.bind(this);
    this.onApplicationConfigurationFormGroupValueChanged = this.onApplicationConfigurationFormGroupValueChanged.bind(this);
    this.onFaultEventsAdded = this.onFaultEventsAdded.bind(this);
    this.closeForm = this.closeForm.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  private _cloneConfigObject(original: SimulationConfiguration): SimulationConfiguration {
    const config = {} as SimulationConfiguration;
    config.power_system_config = { ...original.power_system_config };
    config.application_config = {
      applications: original.application_config.applications.length > 0 ?
        [{ ...original.application_config.applications[0] }] : []
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
    this._modelDictionarySubscription = this._stateStore.select('modelDictionary')
      .subscribe({
        next: modelDictionary => this.setState({ modelDictionary })
      });

    this._simulationStatusSubscription = this._simulationControlService.statusChanges()
      .subscribe({
        next: status => this.setState({
          disableSubmitButton: status !== SimulationStatus.STOPPED
        })
      });
  }

  componentWillUnmount() {
    this._modelDictionarySubscription.unsubscribe();
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
                  feederModel={this.props.feederModel}
                  onChange={this.onPowerSystemConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Simulation Configuration'>
                <SimulationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  simulationName={this.state.simulationName}
                  onChange={this.onSimulationConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Application Configuration'>
                <ApplicationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  availableApplications={this.props.availableApplications}
                  onChange={this.onApplicationConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Test Configuration'>
                {this.showCurrentComponentForTestConfigurationTab()}
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

  onPowerSystemConfigurationFormGroupValueChanged(formValue: PowerSystemConfigurationFormGroupValue) {
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
        this.props.onMRIDChanged(formValue.lineId, formValue.simulationName);
    }
    this.setState({
      lineName: formValue.lineId,
      disableSubmitButton: !formValue.isValid
    });
  }

  onSimulationConfigurationFormGroupValueChanged(formValue: SimulationConfigurationFormGroupValue) {
    if (formValue.isValid) {
      this.currentConfig.simulation_config.start_time = formValue.startDateTime;
      this.currentConfig.simulation_config.duration = formValue.duration;
      this.currentConfig.simulation_config.simulator = formValue.simulator;
      this.currentConfig.simulation_config.run_realtime = formValue.runInRealtime;
      if (formValue.simulationName.includes('[NEW]'))
        this.currentConfig.simulation_config.simulation_name = formValue.simulationName.replace('[NEW]', '');
      this.currentConfig.simulation_config.model_creation_config = formValue.modelCreationConfig;
    }
    this.setState({
      disableSubmitButton: !formValue.isValid
    });
  }

  onApplicationConfigurationFormGroupValueChanged(formValue: ApplicationConfigurationFormGroupValue) {
    if (formValue.applicationId !== '') {
      const selectedApplication = this.currentConfig.application_config.applications.pop() || { name: '', config_string: '' };
      selectedApplication.name = formValue.applicationId;
      selectedApplication.config_string = formValue.configString;
      this.currentConfig.application_config.applications.push(selectedApplication);
    }
    else
      this.currentConfig.application_config.applications.pop();
  }

  onFaultEventsAdded(events: { outage: CommOutageEvent[]; fault: FaultEvent[] }) {
    this.outageEvents = events.outage;
    this.faultEvents = events.fault;
  }

  showCurrentComponentForTestConfigurationTab() {
    if (this.state.lineName === '')
      return (
        <NotificationBanner persistent={true}>
          Please select a line name
        </NotificationBanner>
      );
    if (!this.state.modelDictionary)
      return (
        <NotificationBanner persistent={true}>
          Fetching model dictionary
          <ThreeDots />
        </NotificationBanner>
      );
    return (
      <TestConfigurationFormGroup
        modelDictionary={this.state.modelDictionary}
        simulationStartDate={this.dateTimeService.format(this.simulationStartDate)}
        simulationStopDate={this.dateTimeService.format(this.calculateSimulationStopTime())}
        onEventsAdded={this.onFaultEventsAdded} />
    );
  }

  calculateSimulationStopTime() {
    return +this.currentConfig.simulation_config.duration * 1000 + this.simulationStartDate.getTime();
  }

  closeForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.props.onClose(event);
    this.setState({ show: false });
  }

  submitForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.setState({ show: false });
    this.currentConfig.test_config.appId = this.state.lineName;
    for (const outageEvent of this.outageEvents)
      this.currentConfig.test_config.events.push(this._transformOutageEventForForSubmission(outageEvent));
    for (const faultEvent of this.faultEvents)
      this.currentConfig.test_config.events.push(this._transformFaultEventForForSubmission(faultEvent));
    this._stateStore.update({
      faultEvents: this.faultEvents,
      outageEvents: this.outageEvents
    });
    this.props.onSubmit(this.currentConfig);
  }

  private _transformOutageEventForForSubmission(outageEvent: CommOutageEvent) {
    return {
      allInputOutage: outageEvent.allInputOutage,
      allOutputOutage: outageEvent.allOutputOutage,
      inputOutageList: this._flattenArray(outageEvent.inputList.map(inputItem => {
        if (Array.isArray(inputItem.mRID))
          return inputItem.phases.map(phase => ({
            objectMrid: inputItem.mRID[phase.phaseIndex],
            attribute: inputItem.attribute
          }));
        return {
          objectMrid: inputItem.mRID,
          attribute: inputItem.attribute
        };
      })),
      outputOutageList: outageEvent.outputList.map(outputItem => outputItem.mRID),
      event_type: outageEvent.type,
      occuredDateTime: this.dateTimeService.parse(outageEvent.startDateTime).getTime(),
      stopDateTime: this.dateTimeService.parse(outageEvent.stopDateTime).getTime()
    };
  }

  private _transformFaultEventForForSubmission(faultEvent: FaultEvent) {
    return {
      PhaseConnectedFaultKind: faultEvent.faultKind,
      FaultImpedance: this._getImpedance(faultEvent),
      ObjectMRID: Array.isArray(faultEvent.mRID)
        ? faultEvent.phases.map(phase => faultEvent.mRID[phase.phaseIndex])
        : [faultEvent.mRID],
      phases: faultEvent.phases.map(phase => phase.phaseLabel).join(''),
      event_type: faultEvent.type,
      occuredDateTime: this.dateTimeService.parse(faultEvent.startDateTime).getTime() / 1000.0,
      stopDateTime: this.dateTimeService.parse(faultEvent.stopDateTime).getTime() / 1000.0
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
