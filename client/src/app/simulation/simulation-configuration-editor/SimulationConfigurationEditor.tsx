import { Component } from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Application } from '@client:common/Application';
import { Dialog, DialogContent, DialogActionGroup } from '@client:common/overlay/dialog';
import { BasicButton } from '@client:common/buttons';
import { DateTimeService } from '@client:common/DateTimeService';
import { FaultEvent, CommOutageEvent, ScheduledCommandEvent } from '@client:common/test-manager';
import { StateStore } from '@client:common/state-store';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { Service } from '@client:common/Service';
import { FormGroupModel, Form, FormArrayModel } from '@client:common/form';
import { unique } from '@client:common/misc';
import { FeederModel, ModelDictionary, ModelDictionaryComponent } from '@client:common/topology';
import { SimulationConfiguration, SimulationManagementService } from '@client:common/simulation';
import { ThreeDots } from '@client:common/three-dots';
import { TabGroup, Tab } from '@client:common/tabs';
import { SimulationStatus } from '@project:common/SimulationStatus';
import { Notification } from '@client:common/overlay/notification';

import { PowerSystemConfigurationTab } from './views/power-system-configuration-tab';
import { SimulationConfigurationTab } from './views/simulation-configuration-tab';
import { ApplicationConfigurationTab } from './views/application-configuration-tab';
import { TestConfigurationTab } from './views/test-configuration-tab';
import { PowerSystemConfigurationModel } from './models/PowerSystemConfigurationModel';
import { SimulationConfigurationTabModel } from './models/SimulationConfigurationTabModel';
import { ApplicationConfigurationModel } from './models/ApplicationConfigurationModel';
import { ServiceConfigurationTab } from './views/service-configuration-tab';
import { ServiceConfigurationModel } from './models/ServiceConfigurationModel';
import { TestConfigurationModel } from './models/TestConfigurationModel';

import './SimulationConfigurationEditor.light.scss';
import './SimulationConfigurationEditor.dark.scss';

interface Props {
  isUploaded: boolean;
  initialConfig: SimulationConfiguration;
  feederModel: FeederModel;
  availableApplications: Application[];
  onSubmit: (configObject: SimulationConfiguration) => void;
  onMRIDChanged: (mRID: string) => void;
  onClose: () => void;
}

interface State {
  show: boolean;
  modelDictionary: ModelDictionary;
  disableSubmitButton: boolean;
  lineName: string;
  modelDictionaryComponents: ModelDictionaryComponent[];
  services: Service[];
  simulators: string[];
}

export class SimulationConfigurationEditor extends Component<Props, State> {

  readonly currentConfig: SimulationConfiguration;
  readonly simulationStartDate = Date.now() / 1000;
  readonly dateTimeService = DateTimeService.getInstance();
  readonly formGroupModel = new FormGroupModel({
    powerSystemConfig: new FormGroupModel<PowerSystemConfigurationModel>(),
    simulationConfig: new FormGroupModel<SimulationConfigurationTabModel>(),
    applicationConfig: new FormGroupModel<ApplicationConfigurationModel>(),
    testConfig: new FormGroupModel<TestConfigurationModel>({
      commOutageEvents: new FormArrayModel<CommOutageEvent>(),
      faultEvents: new FormArrayModel<FaultEvent>(),
      scheduledCommandEvents: new FormArrayModel<ScheduledCommandEvent>()
    }),
    serviceConfig: new FormArrayModel<ServiceConfigurationModel>([])
  });

  commOutageEvents: CommOutageEvent[] = [];
  faultEvents: FaultEvent[] = [];
  scheduledCommandEvents: ScheduledCommandEvent[] = [];

  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      modelDictionary: null,
      disableSubmitButton: true,
      lineName: props.initialConfig.power_system_config.Line_name,
      modelDictionaryComponents: [],
      services: [],
      simulators: []
    };
    this.currentConfig = this._cloneConfigObject(props.initialConfig, this.props.isUploaded);

    this.closeForm = this.closeForm.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  private _cloneConfigObject(original: SimulationConfiguration, isUploaded: boolean): SimulationConfiguration {
    const errorMessage = this._validateFileContent(original);
    let result: any = {};
    try {
      if (isUploaded && errorMessage.length > 0) {
        // eslint-disable-next-line no-throw-literal
        throw new Error('Wrong Format Json File.');
      } else {
        result = {
          // eslint-disable-next-line camelcase
          power_system_config: {
            ...original.power_system_config
          },
          // eslint-disable-next-line camelcase
          application_config: {
            applications: original.application_config.applications.length > 0
              ? [{ ...original.application_config.applications[0] }]
              : []
          },
          // eslint-disable-next-line camelcase
          simulation_config: {
            ...original.simulation_config,
            // eslint-disable-next-line camelcase
            start_time: isUploaded ? original.simulation_config.start_time : this.dateTimeService.format(this.simulationStartDate)
          },
          // eslint-disable-next-line camelcase
          test_config: {
            events: original.test_config.events.map(event => Object.assign({}, event)),
            appId: original.test_config.appId
          },
          // eslint-disable-next-line camelcase
          service_configs: [
            ...original.service_configs
          ]
        };
        return result;
      }
    } catch (error) {
      Notification.open(errorMessage);
    }

    return null;
  }

  private _validateFileContent(fileContent: SimulationConfiguration): string {
    let errorMessage = '';
    if (fileContent === null || fileContent === undefined) {
      errorMessage += 'File is empty. Please upload a new one.';
    } else {
      const requiredConfigs = [
        'power_system_config',
        'simulation_config',
        'application_config',
        'service_configs',
        'test_config'
      ];
      const requiredPowerSystemConfigs = [
        'GeographicalRegion_name',
        'SubGeographicalRegion_name',
        'Line_name'
      ];
      const requiredSimulationConfigs = [
        'start_time',
        'duration',
        'simulator',
        'run_realtime',
        'timestep_frequency',
        'timestep_increment',
        'simulation_name',
        'power_flow_solver_method',
        'model_creation_config'
      ];
      const requiredTestConfigs = ['events', 'appId'];
      const objKeys = Object.keys(fileContent);

      for (const config of requiredConfigs) {
        if (!objKeys.includes(config)) {
          errorMessage += `Missing ${config}. `;
        }
      }

      if (errorMessage.length === 0) {
        for (const config of requiredPowerSystemConfigs) {
          if (!Object.prototype.hasOwnProperty.call(fileContent['power_system_config'], config)) {
            errorMessage += `Missing power_system_config: ${config}. `;
          }
        }
        for (const config of requiredSimulationConfigs) {
          if (!Object.prototype.hasOwnProperty.call(fileContent['simulation_config'], config)) {
            errorMessage += `Missing simulation_config: ${config}. `;
          }
        }
        for (const config of requiredTestConfigs) {
          if (!Object.prototype.hasOwnProperty.call(fileContent['test_config'], config)) {
            errorMessage += `Missing test_config: ${config}. `;
          }
        }
      }
    }
    return errorMessage;
  }

  componentDidMount() {
    this._stateStore.select('modelDictionary')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: modelDictionary => this.setState({ modelDictionary })
      });

    this._simulationManagementService.simulationStatusChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: status => this.setState({
          disableSubmitButton: status !== SimulationStatus.STOPPED
        })
      });

    this._stateStore.select('modelDictionaryComponents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: components => this.setState({
          modelDictionaryComponents: components
        })
      });

    this._stateStore.select('services')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: services => {
          this.setState({
            services
          });
        }
      });

    const servicesAsSimulator = this.state.services.filter(service => 'category' as 'SIMULATOR' in service);
    this.setState({
      simulators: servicesAsSimulator.map(service => service.id)
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
          if (formValue) {
            if ('line' in formValue) {
              if (formValue.line) {
                this.props.onMRIDChanged(formValue.line.id);
                this.setState({
                  lineName: formValue.line.id
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.formGroupModel.findControl('simulationConfig.simulation_name' as any)
                  .setValue(formValue.line.name);
              } else {
                this.setState({
                  lineName: ''
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.formGroupModel.findControl('simulationConfig.simulation_name' as any).setValue('');
              }
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
    if (this.currentConfig !== null) {
      return (
        <Dialog
          open={this.state.show}
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
                    isUploaded={this.props.isUploaded}
                    parentFormGroupModel={this.formGroupModel.findControl('simulationConfig')}
                    simulationConfig={this.currentConfig.simulation_config}
                    simulators={this.state.simulators}
                    services={this.state.services} />
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
                    uploadedServiceConfig={this.currentConfig.service_configs}
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
    } else {
      return null;
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
        parentFormGroupModel={this.formGroupModel.findControl('testConfig')}
        modelDictionary={this.state.modelDictionary}
        uploadedTestConfigs={this.currentConfig.test_config}
        simulationStartDateTime={this.simulationStartDate}
        simulationStopDateTime={+this.currentConfig.simulation_config.duration + this.simulationStartDate}
        modelDictionaryComponents={this.state.modelDictionaryComponents} />
    );
  }

  closeForm(event: React.SyntheticEvent) {
    event.stopPropagation();
    this.setState({
      show: false
    });
  }

  onSubmitForm() {
    this._populatePowerSystemConfigSection();
    this._populateSimulationConfigSection();
    this._populateApplicationConfigSection();
    this._populateTestConfigSection();
    this._populateServiceConfigSection();
    this.setState({
      show: false
    }, () => this.props.onSubmit(this.currentConfig));
  }

  private _populatePowerSystemConfigSection() {
    const powerSystemConfigFormValue = this.formGroupModel.findControl('powerSystemConfig').getValue();
    // eslint-disable-next-line camelcase
    this.currentConfig.power_system_config.GeographicalRegion_name = powerSystemConfigFormValue.region.id;
    // eslint-disable-next-line camelcase
    this.currentConfig.power_system_config.SubGeographicalRegion_name = powerSystemConfigFormValue.subregion.id;
    // eslint-disable-next-line camelcase
    this.currentConfig.power_system_config.Line_name = powerSystemConfigFormValue.line.id;
  }

  private _populateSimulationConfigSection() {
    // eslint-disable-next-line camelcase
    this.currentConfig.simulation_config = {
      ...this.currentConfig.simulation_config,
      ...this.formGroupModel.findControl('simulationConfig').getValue()
    };
  }

  private _populateApplicationConfigSection() {
    // if "name" is an empty string, no app was selected, so we only
    // want to send an empty array in that case in the config
    if (this.formGroupModel.findControl('applicationConfig').getValue().applications[0].name === '') {
      this.currentConfig.application_config.applications = [];
    } else {
      this.currentConfig.application_config.applications = this.formGroupModel.findControl('applicationConfig').getValue().applications;
    }
  }

  private _populateTestConfigSection() {
    const selectedApplication = this.currentConfig.application_config.applications[0];
    const testConfigFormValue = this.formGroupModel.findControl('testConfig').getValue();
    this.currentConfig.test_config.appId = selectedApplication?.name || '';
    this.currentConfig.test_config.events = [];
    for (const outageEvent of testConfigFormValue.commOutageEvents) {
      this.currentConfig.test_config.events.push(this._transformOutageEventForSubmission(outageEvent));
    }
    for (const faultEvent of testConfigFormValue.faultEvents) {
      this.currentConfig.test_config.events.push(this._transformFaultEventForSubmission(faultEvent));
    }
    for (const scheduledCommandEvent of testConfigFormValue.scheduledCommandEvents) {
      this.currentConfig.test_config.events.push(this._transformScheduledCommandEventForSubmission(scheduledCommandEvent));
    }
    this._stateStore.update({
      faultEvents: testConfigFormValue.faultEvents,
      commOutageEvents: testConfigFormValue.commOutageEvents,
      scheduledCommandEvents: testConfigFormValue.scheduledCommandEvents
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
      // eslint-disable-next-line camelcase
      event_type: outageEvent.event_type,
      occuredDateTime: outageEvent.startDateTime,
      stopDateTime: outageEvent.stopDateTime
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ? unique(faultEvent.phases.map(e => faultEvent.mRID[e.phaseIndex]).filter(e => e !== undefined))
        : [faultEvent.mRID],
      phases: faultEvent.phases.map(phase => phase.phaseLabel).join(''),
      // eslint-disable-next-line camelcase
      event_type: faultEvent.event_type,
      occuredDateTime: faultEvent.startDateTime,
      stopDateTime: faultEvent.stopDateTime
    };
  }

  private _transformScheduledCommandEventForSubmission(scheduledCommandEvent: ScheduledCommandEvent) {
    return {
      message: {
        // eslint-disable-next-line camelcase
        forward_differences: Array.isArray(scheduledCommandEvent.mRID)
          ? scheduledCommandEvent.mRID.map(mrid => ({
            object: mrid,
            attribute: scheduledCommandEvent.attribute,
            value: scheduledCommandEvent.forwardDifferenceValue
          }))
          : [{
            object: scheduledCommandEvent.mRID,
            attribute: scheduledCommandEvent.attribute,
            value: scheduledCommandEvent.forwardDifferenceValue
          }],
        // eslint-disable-next-line camelcase
        reverse_differences: Array.isArray(scheduledCommandEvent.mRID)
          ? scheduledCommandEvent.mRID.map(mrid => ({
            object: mrid,
            attribute: scheduledCommandEvent.attribute,
            value: scheduledCommandEvent.reverseDifferenceValue
          }))
          : [{
            object: scheduledCommandEvent.mRID,
            attribute: scheduledCommandEvent.attribute,
            value: scheduledCommandEvent.reverseDifferenceValue
          }]
      },
      // eslint-disable-next-line camelcase
      event_type: 'ScheduledCommandEvent',
      occuredDateTime: scheduledCommandEvent.startDateTime,
      stopDateTime: scheduledCommandEvent.stopDateTime
    };
  }

  private _populateServiceConfigSection() {
    // eslint-disable-next-line camelcase
    this.currentConfig.service_configs = this.formGroupModel.findControl('serviceConfig').getValue();
  }

}
