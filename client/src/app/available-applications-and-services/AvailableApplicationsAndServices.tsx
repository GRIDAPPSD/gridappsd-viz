import { Component } from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { TabGroup, Tab } from '@client:common/tabs';
import { FormGroupModel, Form, FormArrayModel } from '@client:common/form';
import { FieldModelConfiguration } from '@client:common/field-model-datastream';
import { Application } from '@client:common/Application';
import { Service } from '@client:common/Service';
import { StateStore } from '@client:common/state-store';
import { Notification } from '@client:common/overlay/notification';
import { BasicButton } from '@client:common/buttons';

import { ApplicationConfigurationTab } from '../simulation/simulation-configuration-editor/views/application-configuration-tab';
import { ServiceConfigurationTab } from '../simulation/simulation-configuration-editor/views/service-configuration-tab';

import { ResponseBody } from './models/ResponseBody';
import { ApplicationsTab } from './views/applications-tab/ApplicationsTab';
import { ServicesTab } from './views/services-tab/ServicesTab';
import { ApplicationInstancesTab } from './views/application-instances-tab/ApplicationInstancesTab';
import { ServiceInstancesTab } from './views/service-instances-tab/ServiceInstancesTab';

import './AvailableApplicationsAndServices.light.scss';
import './AvailableApplicationsAndServices.dark.scss';

export interface Props {
  responseBody: ResponseBody;
  fieldModelMrid?: string;
  availableApplications: Application[];
  initialFieldModelConfig: FieldModelConfiguration;
  onSubmit: (configObject: FieldModelConfiguration) => void;
}

export interface State {
  services: Service[];
  disableSubmitButton: boolean;
}

interface ApplicationConfigurationModel {
  applications: Array<{
    name: string;
    // eslint-disable-next-line camelcase
    config_string: string;
  }>;
}

interface ServiceConfigurationModel {
  id: string;
  // eslint-disable-next-line camelcase
  user_options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

/**
 * Class component that is rendered when the menu item
 * "Applications and Services" in the drawer is selected.
 *
 * @param props
 */
export class AvailableApplicationsAndServices extends Component<Props, State> {
  readonly currentConfig: FieldModelConfiguration;
  readonly formGroupModel = new FormGroupModel({
    applicationConfig: new FormGroupModel<ApplicationConfigurationModel>(),
    serviceConfig: new FormArrayModel<ServiceConfigurationModel>([])
  });

  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      services: [],
      disableSubmitButton: true
    };
    this.currentConfig = this._cloneConfigObject(props.initialFieldModelConfig);
    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  private _cloneConfigObject(original: FieldModelConfiguration): FieldModelConfiguration {
    const errorMessage = this._validateFileContent(original);
    let result: any = {};
    try {
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
          start_time: original.simulation_config.start_time
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
    } catch (error) {
      Notification.open(errorMessage);
    }
    return null;
  }

  private _validateFileContent(fileContent: FieldModelConfiguration): string {
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
    this._stateStore.select('services')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: services => {
          this.setState({
            services
          });
        }
      });

    this.formGroupModel.validityChanges()
    .subscribe({
      next: isValid => {
        this.setState({
          disableSubmitButton: !isValid
        });
      }
    });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this.formGroupModel.cleanup();
  }

  renderApplicationConfigTab = (fieldModelMrid: string | undefined) => {
    if (fieldModelMrid) {
      return (
        <Tab label='Application Configuration'>
          <ApplicationConfigurationTab
            parentFormGroupModel={this.formGroupModel.findControl('applicationConfig')}
            applicationConfig={this.currentConfig.application_config}
            availableApplications={this.props.availableApplications} />
        </Tab>
      );
    }
    return null;
  };

  renderServiceConfigTab = (fieldModelMrid: string | undefined) => {
    if (fieldModelMrid) {
      return (
        <Tab label='Service Configuration'>
          <ServiceConfigurationTab
            parentFormArrayModel={this.formGroupModel.findControl('serviceConfig')}
            uploadedServiceConfig={this.currentConfig.service_configs}
            services={this.state.services} />
        </Tab>
      );
    }
    return null;
  };

  onSubmitForm() {
    this._populateApplicationConfigSection();
    this._populateServiceConfigSection();
    this.props.onSubmit(this.currentConfig);
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

  private _populateServiceConfigSection() {
    // eslint-disable-next-line camelcase
    this.currentConfig.service_configs = this.formGroupModel.findControl('serviceConfig').getValue();
  }

  render() {
    const {responseBody}=this.props;
    if (!this.props.responseBody) {
      return <ProgressIndicator show />;
    } else if (this.props.fieldModelMrid ){
      return (
        <section className='available-applications-and-services'>
          <Form
            className='field-model-simulation-configuration-form'
            formGroupModel={this.formGroupModel}>
            <TabGroup>
              <Tab label='Applications'>
                <ApplicationsTab applications={responseBody.applications} />
              </Tab>
              <Tab label='Services'>
                <ServicesTab services={responseBody.services} />
              </Tab>
              <Tab label='Application Instances'>
                <ApplicationInstancesTab instances={responseBody.appInstances} />
              </Tab>
              <Tab label='Service Instances'>
                <ServiceInstancesTab instances={responseBody.serviceInstances} />
              </Tab>
              {this.renderApplicationConfigTab(this.props.fieldModelMrid)}
              {this.renderServiceConfigTab(this.props.fieldModelMrid)}
            </TabGroup>
          </Form>
          <BasicButton
            label='Submit'
            type='positive'
            disabled={this.state.disableSubmitButton}
            onClick={this.onSubmitForm}
          />
        </section>
      );
    } else {
      return (
        <section className='available-applications-and-services'>
            <TabGroup>
              <Tab label='Applications'>
                <ApplicationsTab applications={responseBody.applications} />
              </Tab>
              <Tab label='Services'>
                <ServicesTab services={responseBody.services} />
              </Tab>
              <Tab label='Application Instances'>
                <ApplicationInstancesTab instances={responseBody.appInstances} />
              </Tab>
              <Tab label='Service Instances'>
                <ServiceInstancesTab instances={responseBody.serviceInstances} />
              </Tab>
            </TabGroup>
        </section>
      );
    }
  }
}
