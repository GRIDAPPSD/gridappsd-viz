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
import { FaultEvent, FaultKind } from './models/FaultEvent';
import { PowerSystemConfigurationFormGroupValue } from './models/PowerSystemConfigurationFormGroupValue';
import { SimulationConfigurationFormGroupValue } from './models/SimulationConfigurationFormGroupValue';
import { ApplicationConfigurationFormGroupValue } from './models/ApplicationConfigurationFormGroupValue';
import { Store } from '@shared/Store';
import { ApplicationState } from '@shared/ApplicationState';

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
  modelDictionary: ModelDictionary;
  disableSubmitButton: boolean;
  lineName: string;
}

export class SimulationConfigurationEditor extends React.Component<Props, State> {

  readonly currentConfig: SimulationConfiguration;
  readonly simulationStartDate = new Date();
  readonly dateTimeService = DateTimeService.getInstance();

  outageEvents: OutageEvent[] = [];
  faultEvents: FaultEvent[] = [];

  private readonly _modelDictionaryTracker = ModelDictionaryTracker.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _store = Store.getInstance<ApplicationState>();

  private _subscription: Subscription;
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
                  feederModels={this.props.feederModels}
                  onChange={this.onPowerSystemConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Simulation Configuration'>
                <SimulationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  onChange={this.onSimulationConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Application Configuration'>
                <ApplicationConfigurationFormGroup
                  currentConfig={this.currentConfig}
                  availableApplications={this.props.availableApplications}
                  onChange={this.onApplicationConfigurationFormGroupValueChanged} />
              </Tab>
              <Tab label='Test Configuration'>
                {
                  (this.state.modelDictionary && this.state.lineName)
                    ? <TestConfigurationFormGroup
                      modelDictionary={this.state.modelDictionary}
                      simulationStartDate={this.dateTimeService.format(this.simulationStartDate)}
                      simulationStopDate={this.dateTimeService.format(this.calculateSimulationStopTime())}
                      onEventsAdded={this.onFaultEventsAdded} />
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
    const currentPowerSystemConfig = this.currentConfig.power_system_config;
    currentPowerSystemConfig.GeographicalRegion_name = formValue.geographicalRegionId;
    currentPowerSystemConfig.SubGeographicalRegion_name = formValue.subGeographicalRegionId;
    if (formValue.lineName === '') {
      currentPowerSystemConfig.Line_name = '';
      this.setState({
        disableSubmitButton: true,
        lineName: ''
      });
    }
    else if (currentPowerSystemConfig.Line_name !== formValue.lineName) {
      currentPowerSystemConfig.Line_name = formValue.lineName;
      this.currentConfig.simulation_config.simulation_name = formValue.simulationName;
      this.props.onMRIDChanged(formValue.lineName, formValue.simulationName);
      this.setState({
        lineName: formValue.lineName,
        disableSubmitButton: false
      });
    }
  }

  onSimulationConfigurationFormGroupValueChanged(formValue: SimulationConfigurationFormGroupValue) {
    for (const key in formValue)
      this.currentConfig.simulation_config[key] = formValue[key];
  }

  onApplicationConfigurationFormGroupValueChanged(formValue: ApplicationConfigurationFormGroupValue) {
    if (formValue.applicationId !== '') {
      const selectedApplication = this.currentConfig.application_config.applications.pop();
      selectedApplication.name = formValue.applicationId;
      selectedApplication.config_string = formValue.configString;
      this.currentConfig.application_config.applications.push(selectedApplication);
    }
    else
      this.currentConfig.application_config.applications.pop();
  }

  onFaultEventsAdded(events: { outage: OutageEvent[]; fault: FaultEvent[] }) {
    this.outageEvents = events.outage;
    this.faultEvents = events.fault;
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
    this._store.mergeState({
      faultEvents: this.faultEvents,
      outageEvents: this.outageEvents
    });
    this.props.onSubmit(this.currentConfig);
  }

  private _transformOutageEventForForSubmission(outageEvent: OutageEvent) {
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
      impedance: this._getImpedance(faultEvent),
      equipmentMrid: Array.isArray(faultEvent.mRID)
        ? faultEvent.phases.map(phase => faultEvent.mRID[phase.phaseIndex])
        : faultEvent.mRID,
      phases: faultEvent.phases.map(phase => phase.phaseLabel).join(''),
      event_type: faultEvent.type,
      occuredDateTime: this.dateTimeService.parse(faultEvent.startDateTime).getTime(),
      stopDateTime: this.dateTimeService.parse(faultEvent.stopDateTime).getTime()
    };
  }

  private _getImpedance(faultEvent: FaultEvent) {
    if (faultEvent.faultKind === FaultKind.LINE_TO_GROUND)
      return {
        xGround: faultEvent.impedance.xGround,
        rGround: faultEvent.impedance.rGround
      };
    if (faultEvent.faultKind === FaultKind.LINE_TO_LINE)
      return {
        xLineToLine: faultEvent.impedance.xLineToLine,
        rLineToLine: faultEvent.impedance.rLinetoLine
      };
    return {
      xGround: faultEvent.impedance.xGround,
      rGround: faultEvent.impedance.rGround,
      xLineToLine: faultEvent.impedance.xLineToLine,
      rLineToLine: faultEvent.impedance.rLinetoLine
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
