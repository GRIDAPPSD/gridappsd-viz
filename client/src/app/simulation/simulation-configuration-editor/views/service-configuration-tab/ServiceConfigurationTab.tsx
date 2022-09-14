import { Component } from 'react';
import { filter } from 'rxjs/operators';

import { Service, ServiceConfigUserInputSpec } from '@client:common/Service';
import { BasicButton } from '@client:common/buttons';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { Notification } from '@client:common/overlay/notification';
import { FormArrayModel, SelectionOptionBuilder, FormControlModel, Select } from '@client:common/form';
import { SimulationConfiguration } from '@client:common/simulation';

import { ServiceConfigurationModel } from '../../models/ServiceConfigurationModel';

import { ServiceConfiguration } from './ServiceConfiguration';

import './ServiceConfigurationTab.light.scss';
import './ServiceConfigurationTab.dark.scss';

interface Props {
  parentFormArrayModel: FormArrayModel<ServiceConfigurationModel>;
  services: Service[];
  uploadedServiceConfig: SimulationConfiguration['service_configs'];
}

interface State {
  disableApplyButton: boolean;
  selectedServices: Service[];
  serviceOptionBuilder: SelectionOptionBuilder<Service>;
}

export class ServiceConfigurationTab extends Component<Props, State> {

  readonly internalFormArrayModel = new FormArrayModel<ServiceConfigurationModel>();
  readonly availableServicesFormControl = new FormControlModel<Service[]>([]);

  constructor(props: Props) {
    super(props);

    this.state = {
      disableApplyButton: true,
      selectedServices: [],
      serviceOptionBuilder: new SelectionOptionBuilder(this.props.services, service => service.id)
    };

    this.saveChanges = this.saveChanges.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.services !== prevProps.services) {
      if (this.props.uploadedServiceConfig && this.props.uploadedServiceConfig.length > 0) {
        const filteredUploadedServices = this._handleFilteredUploadedServiceFile(this.props.services, this.props.uploadedServiceConfig);
        this.setState({
          serviceOptionBuilder: new SelectionOptionBuilder(this.props.services, service => service.id),
          selectedServices: filteredUploadedServices
        });
      } else {
        this.setState({
          serviceOptionBuilder: new SelectionOptionBuilder(this.props.services, service => service.id)
        });
      }
    }
    this.props.parentFormArrayModel.setValue(this.internalFormArrayModel.getValue());
  }

  private _handleFilteredUploadedServiceFile(allAvailableServices: Service[], uploadedServices: SimulationConfiguration['service_configs']) {
    const uploadedServiceConfigsMap = new Map<string, any>();
    for (const uploadedService of uploadedServices) {
      uploadedServiceConfigsMap.set(uploadedService.id, uploadedService.user_options);
    }

    const overlappedServices = allAvailableServices.filter(s1 => uploadedServices.some(s2 => s1.id === s2.id));

    const overlappedServicesMap = new Map<string, any>();
    for (const overlap of overlappedServices) {
      overlappedServicesMap.set(overlap.id, overlap.user_input);
    }

    for (const overlappedService of overlappedServicesMap.entries()) {
      const overlappedServiceId = overlappedService[0];
      const uploadedServicesMapValue = uploadedServiceConfigsMap.get(overlappedServiceId);
      if (uploadedServicesMapValue) {
        const overlapMapValue = overlappedServicesMap.get(overlappedServiceId);
        for (const uploadedServicesMapValueKey of Object.keys(uploadedServicesMapValue)) {
          overlapMapValue[uploadedServicesMapValueKey]['default_value'] = uploadedServicesMapValue[uploadedServicesMapValueKey];
        }
      }
    }
    return overlappedServices;
  }


  componentDidMount() {
    this.internalFormArrayModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableApplyButton: !isValid
          });
        }
      });
    this.availableServicesFormControl.valueChanges()
      .pipe(filter(selectedServices => selectedServices !== this.state.selectedServices))
      .subscribe({
        next: selectedServices => {
          const servicesWithUserInput = selectedServices.filter(service => 'user_input' in service);
          for (const userInput of servicesWithUserInput.map(service => service.user_input)) {
            for (const inputSpec of Object.values(userInput)) {
              // eslint-disable-next-line camelcase
              inputSpec.help_example = this._formatUserInputExampleValue(inputSpec);
            }
          }
          this.setState({
            selectedServices
          }, () => this.props.parentFormArrayModel.removeAllControls());
        }
      });
  }

  private _formatUserInputExampleValue(userInputSpec: ServiceConfigUserInputSpec) {
    switch (userInputSpec.type) {
      case 'object':
        return JSON.stringify(userInputSpec.help_example, null, 4);
      case 'bool':
        return `${userInputSpec.help_example} (${userInputSpec.help_example ? 'Checked' : 'Unchecked'})`;
      default:
        return String(userInputSpec.help_example);
    }
  }

  componentWillUnmount() {
    this.internalFormArrayModel.cleanup();
    this.availableServicesFormControl.cleanup();
  }

  render() {
    if (this.props.services.length === 0) {
      return (
        <MessageBanner>
          Unable to fetch services, please refresh your browser
        </MessageBanner>
      );
    }
    return (
      <div className='service-configuration-tab'>
        <Select
          multiple
          optional
          label='Available Services'
          selectionOptionBuilder={this.state.serviceOptionBuilder}
          selectedOptionFinder={
            service => {
              for(const config of this.props.uploadedServiceConfig) {
                if (service.id === config.id) {
                  return true;
                }
              }
              return false;
            }
          }
          formControlModel={this.availableServicesFormControl} />
        {
          this.state.selectedServices.length > 0
          &&
          <>
            {
              this.state.selectedServices.map(service =>
                <ServiceConfiguration
                  key={service.id}
                  service={service}
                  parentFormArrayModel={this.internalFormArrayModel} />
              )
            }
            <BasicButton
              className='service-configuration-tab__apply'
              label='Apply'
              type='positive'
              disabled={this.state.disableApplyButton}
              onClick={this.saveChanges} />
          </>
        }
      </div>
    );
  }

  saveChanges() {
    try {
      this.props.parentFormArrayModel.setValue(this.internalFormArrayModel.getValue());
      Notification.open('Changes saved successfully');
      this.setState({
        disableApplyButton: true
      });
    } catch {
      Notification.open('Failed to save changes');
    }
  }

}
