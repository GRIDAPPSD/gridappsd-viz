import * as React from 'react';

import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { ServiceConfigurationModel } from '../../models/ServiceConfigurationModel';
import { BasicButton } from '@shared/buttons';
import { MessageBanner } from '@shared/overlay/message-banner';
import { showNotification } from '@shared/overlay/notification';
import { FormArrayModel } from '@shared/form';
import { ServiceConfiguration } from './ServiceConfiguration';
import { waitUntil } from '@shared/misc';

import './ServiceConfigurationTab.light.scss';
import './ServiceConfigurationTab.dark.scss';

interface Props {
  parentFormArrayModel: FormArrayModel<ServiceConfigurationModel>;
  services: Service[];
}

interface State {
  disableApplyButton: boolean;
  servicesWithUserInput: Service[];
}

export class ServiceConfigurationTab extends React.Component<Props, State> {

  readonly formArrayModel = new FormArrayModel<ServiceConfigurationModel>();

  constructor(props: Props) {
    super(props);

    this.state = {
      disableApplyButton: true,
      servicesWithUserInput: this._findServicesWithUserInput()
    };

    this.saveChanges = this.saveChanges.bind(this);
  }

  private _findServicesWithUserInput() {
    const servicesWithUserInput = this.props.services.filter(service => 'user_input' in service);
    for (const userInput of servicesWithUserInput.map(service => service.user_input)) {
      for (const inputSpec of Object.values(userInput)) {
        inputSpec.help_example = this._formatUserInputExampleValue(inputSpec);
      }
    }
    return servicesWithUserInput;
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

  componentDidUpdate(prevProps: Props) {
    if (this.props.services !== prevProps.services) {
      this.setState({
        servicesWithUserInput: this._findServicesWithUserInput()
      });
    }
  }

  componentDidMount() {
    this.formArrayModel.valueChanges()
      .subscribe({
        next: () => {
          this.setState({
            disableApplyButton: this.formArrayModel.isPristine() || this.formArrayModel.isInvalid()
          });
        }
      });
    waitUntil(() => this.formArrayModel.isValid())
      .then(() => {
        this.props.parentFormArrayModel.setValue(this.formArrayModel.getValue());
      });
  }

  componentWillUnmount() {
    this.formArrayModel.cleanup();
  }

  render() {
    if (this.props.services.length === 0) {
      return (
        <MessageBanner>
          Unable to fetch services, please refresh your browser
        </MessageBanner>
      );
    }
    if (this.state.servicesWithUserInput.length === 0) {
      return (
        <MessageBanner>
          No services with user_input found
        </MessageBanner>
      );
    }
    return (
      <div className='service-configuration-tab'>
        {
          this.state.servicesWithUserInput.map(service => (
            <ServiceConfiguration
              key={service.id}
              service={service}
              parentFormArrayModel={this.formArrayModel} />
          ))
        }
        <BasicButton
          className='service-configuration-tab__apply'
          label='Apply'
          type='positive'
          disabled={this.state.disableApplyButton}
          onClick={this.saveChanges} />
      </div>
    );
  }

  saveChanges() {
    try {
      this.props.parentFormArrayModel.setValue(this.formArrayModel.getValue());
      showNotification('Changes saved successfully');
      this.setState({
        disableApplyButton: true
      });
    } catch {
      showNotification('Failed to save changes');
    }
  }

}
