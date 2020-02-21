import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SimulationConfiguration, SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { FeederModel, ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { Application } from '@shared/Application';
import { Dialog, DialogContent, DialogActionGroup } from '@shared/dialog';
import { TabGroup, Tab } from '@shared/tabs';
import { BasicButton } from '@shared/buttons';
import { PowerSystemConfigurationTab } from './views/power-system-configuration-tab';
import { SimulationConfigurationTab } from './views/simulation-configuration-tab';
import { ApplicationConfigurationTab } from './views/application-configuration-tab';
import { TestConfigurationTab } from './views/test-configuration-tab';
import { DateTimeService } from '@shared/DateTimeService';
import { FaultEvent, CommOutageEvent, CommandEvent } from '@shared/test-manager';
import { PowerSystemConfigurationModel } from './models/PowerSystemConfigurationModel';
import { SimulationConfigurationTabModel } from './models/SimulationConfigurationTabModel';
import { ApplicationConfigurationModel } from './models/ApplicationConfigurationModel';
import { StateStore } from '@shared/state-store';
import { ThreeDots } from '@shared/three-dots';
import { MessageBanner } from '@shared/message-banner';
import { ServiceConfigurationTab } from './views/service-configuration-tab';
import { Service } from '@shared/Service';
import { ServiceConfigurationModel } from './models/ServiceConfigurationModel';
import { FormGroupModel, Form, FormArrayModel } from '@shared/form';
import { TestConfigurationModel } from './models/TestConfigurationModel';

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
  readonly formGroupModel = new FormGroupModel({
    powerSystemConfig: new FormGroupModel<PowerSystemConfigurationModel>(),
    simulationConfig: new FormGroupModel<SimulationConfigurationTabModel>(),
    applicationConfig: new FormGroupModel<ApplicationConfigurationModel>(),
    testConfig: new FormGroupModel<TestConfigurationModel>({
      outageEvents: new FormArrayModel<CommOutageEvent>(),
      faultEvents: new FormArrayModel<FaultEvent>(),
      commandEvents: new FormArrayModel<CommandEvent>()
    }),
    serviceConfig: new FormArrayModel<ServiceConfigurationModel>([])
  });

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
      modelDictionary: null,
      disableSubmitButton: true,
      lineName: props.initialConfig.power_system_config.Line_name,
      componentsWithGroupedPhases: [],
      services: []
    };

    this.currentConfig = this._cloneConfigObject(props.initialConfig);

    this.closeForm = this.closeForm.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
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

    this.formGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });

    this._processPowerSystemConfigChanges();
  }

  private _processPowerSystemConfigChanges() {
    this.formGroupModel.findControl('powerSystemConfig')
      .valueChanges()
      .subscribe({
        next: formValue => {
          if ('line' in formValue) {
            if (formValue.line) {
              this.props.onMRIDChanged(formValue.line.id);
              this.setState({
                lineName: formValue.line.id
              });
              this.formGroupModel.findControl('simulationConfig.simulation_name' as any)
                .setValue(formValue.line.name);
            } else {
              this.setState({
                lineName: ''
              });
              this.formGroupModel.findControl('simulationConfig.simulation_name' as any).setValue('');
            }
          }
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this.formGroupModel.cleanup();
  }

  render() {
    return (
      <Dialog
        show={this.state.show}
        onAfterClosed={this.props.onClose}>
        <DialogContent>
          <Form
            className='simulation-configuration-form'
            formGroupModel={this.formGroupModel}>
            <TabGroup>
              <Tab label='Power System Configuration'>
                <PowerSystemConfigurationTab
                  parentFormGroupModel={this.formGroupModel.findControl('powerSystemConfig')}
                  powerSystemConfig={this.currentConfig.power_system_config}
                  feederModel={this.props.feederModel} />
              </Tab>
              <Tab label='Simulation Configuration'>
                <SimulationConfigurationTab
                  parentFormGroupModel={this.formGroupModel.findControl('simulationConfig')}
                  simulationConfig={this.currentConfig.simulation_config} />
              </Tab>
              <Tab label='Application Configuration'>
                <ApplicationConfigurationTab
                  parentFormGroupModel={this.formGroupModel.findControl('applicationConfig')}
                  applicationConfig={this.currentConfig.application_config}
                  availableApplications={this.props.availableApplications} />
              </Tab>
              <Tab label='Test Configuration'>
                {this.showCurrentComponentForTestConfigurationTab()}
              </Tab>
              <Tab label='Service Configuration'>
                <ServiceConfigurationTab
                  parentFormArrayModel={this.formGroupModel.findControl('serviceConfig')}
                  services={this.state.services} />
              </Tab>
            </TabGroup>
          </Form>
        </DialogContent>
        <DialogActionGroup>
          <BasicButton
            label='Close'
            type='negative'
            onClick={this.closeForm} />
          <BasicButton
            label='Submit'
            type='positive'
            disabled={this.state.disableSubmitButton}
            onClick={this.onSubmitForm} />
        </DialogActionGroup>
      </Dialog>
    );
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
        parentFormGroupModel={this.formGroupModel.findControl('testConfig')}
        modelDictionary={this.state.modelDictionary}
        simulationStartDateTime={this.simulationStartDate}
        simulationStopDateTime={+this.currentConfig.simulation_config.duration + this.simulationStartDate}
        componentWithConsolidatedPhases={this.state.componentsWithGroupedPhases} />
    );
  }

  closeForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.setState({
      show: false
    });
  }

  onSubmitForm() {
    this.setState({
      show: false
    });
    this._populatePowerSystemConfigSection();
    this._populateSimulationConfigSection();
    this._populateApplicationConfigSection();
    this._populateTestConfigSection();
    this._populateServiceConfigSection();
    this.props.onSubmit(this.currentConfig);
  }

  private _populatePowerSystemConfigSection() {
    const powerSystemConfigFormValue = this.formGroupModel.findControl('powerSystemConfig').getValue();
    this.currentConfig.power_system_config.GeographicalRegion_name = powerSystemConfigFormValue.region.id;
    this.currentConfig.power_system_config.SubGeographicalRegion_name = powerSystemConfigFormValue.subregion.id;
    this.currentConfig.power_system_config.Line_name = powerSystemConfigFormValue.line.id;
  }

  private _populateSimulationConfigSection() {
    this.currentConfig.simulation_config = {
      ...this.currentConfig.simulation_config,
      ...this.formGroupModel.findControl('simulationConfig').getValue()
    };
  }

  private _populateApplicationConfigSection() {
    this.currentConfig.application_config = this.formGroupModel.findControl('applicationConfig').getValue();
    // if "name" is an empty string, no app was selected, so we only
    // want to send an empty array in that case in the config
    if (this.currentConfig.application_config.applications[0].name === '') {
      this.currentConfig.application_config.applications = [];
    }
  }

  private _populateTestConfigSection() {
    const selectedApplication = this.currentConfig.application_config.applications[0];
    const testConfigFormValue = this.formGroupModel.findControl('testConfig').getValue();

    this.currentConfig.test_config.appId = selectedApplication?.name || '';
    for (const outageEvent of testConfigFormValue.outageEvents) {
      this.currentConfig.test_config.events.push(this._transformOutageEventForSubmission(outageEvent));
    }
    for (const faultEvent of testConfigFormValue.faultEvents) {
      this.currentConfig.test_config.events.push(this._transformFaultEventForSubmission(faultEvent));
    }
    for (const commandEvent of testConfigFormValue.commandEvents) {
      this.currentConfig.test_config.events.push(commandEvent);
    }
    this._stateStore.update({
      faultEvents: testConfigFormValue.faultEvents,
      outageEvents: testConfigFormValue.outageEvents,
      commandEvents: testConfigFormValue.commandEvents
    });
  }

  private _transformOutageEventForSubmission(outageEvent: CommOutageEvent) {
    return {
      allInputOutage: outageEvent.allInputOutage,
      allOutputOutage: outageEvent.allOutputOutage,
      inputOutageList: this._flattenArray(outageEvent.inputList.map(inputItem => {
        if (Array.isArray(inputItem.mRID)) {
          return inputItem.phases.map(phase => ({
            objectMRID: inputItem.mRID[phase.phaseIndex],
            attribute: inputItem.attribute
          })).filter(e => e.objectMRID !== undefined);
        }
        return {
          objectMRID: inputItem.mRID,
          attribute: inputItem.attribute
        };
      })),
      outputOutageList: outageEvent.outputList.map(outputItem => outputItem.mRID),
      event_type: outageEvent.eventType,
      occuredDateTime: outageEvent.startDateTime,
      stopDateTime: outageEvent.stopDateTime
    };
  }

  private _flattenArray(array: any[]) {
    const result = [];
    for (const element of array) {
      if (Array.isArray(element)) {
        result.push(...element);
      } else {
        result.push(element);
      }
    }
    return result;
  }

  private _transformFaultEventForSubmission(faultEvent: FaultEvent) {
    return {
      PhaseConnectedFaultKind: faultEvent.faultKind,
      FaultImpedance: faultEvent.faultImpedance,
      ObjectMRID: Array.isArray(faultEvent.mRID)
        ? [...new Set(faultEvent.phases.map(phase => faultEvent.mRID[phase.phaseIndex]).filter(e => e !== undefined))]
        : [faultEvent.mRID],
      phases: faultEvent.phases.map(phase => phase.phaseLabel).join(''),
      event_type: faultEvent.eventType,
      occuredDateTime: faultEvent.startDateTime,
      stopDateTime: faultEvent.stopDateTime
    };
  }

  private _populateServiceConfigSection() {
    this.currentConfig.service_configs = this.formGroupModel.findControl('serviceConfig')
      .getValue();
  }

}
