import * as React from 'react';

import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { ServiceConfigurationEntry } from './ServiceConfigurationEntry';
import { ServiceConfigurationEntryModel } from '../../models/ServiceConfigurationEntryModel';
import { BasicButton } from '@shared/buttons';
import { MessageBanner } from '@shared/message-banner';
import { Notification } from '@shared/notification';

import './ServiceConfigurationTab.light.scss';
import './ServiceConfigurationTab.dark.scss';

interface Props {
  services: Service[];
  onValidationChange: (isValid: boolean) => void;
  onChange: (serviceConfigurationEntryModel: ServiceConfigurationEntryModel[]) => void;
}

interface State {
  disableApplyButton: boolean;
  servicesWithUserInput: Service[];
  showChangesAppliedSuccessfullyMessage: boolean;
}

export class ServiceConfigurationTab extends React.Component<Props, State> {

  private readonly _serviceConfigurationEntries = new Map<Service, ServiceConfigurationEntryModel>();
  private readonly _invalidServiceConfigurationEntries = new Map<Service, true>();

  constructor(props: Props) {
    super(props);

    this.state = {
      disableApplyButton: false,
      servicesWithUserInput: this._findServicesWithUserInput(),
      showChangesAppliedSuccessfullyMessage: false
    };

    this.onServiceConfigurationEntryChanged = this.onServiceConfigurationEntryChanged.bind(this);
    this.onServiceConfigurationEntryValidationChanged = this.onServiceConfigurationEntryValidationChanged.bind(this);
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
        return `
        ${userInputSpec.help_example}
        (${userInputSpec.help_example ? 'Checked' : 'Unchecked'})`;
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
            <ServiceConfigurationEntry
              key={service.id}
              service={service}
              onChange={this.onServiceConfigurationEntryChanged}
              onValidate={this.onServiceConfigurationEntryValidationChanged} />
          ))
        }
        <BasicButton className='service-configuration-tab__apply'
          label='Apply'
          type='positive'
          disabled={this.state.disableApplyButton}
          onClick={this.saveChanges} />
        <Notification
          show={this.state.showChangesAppliedSuccessfullyMessage}
          onHide={() => {
            this.setState({
              showChangesAppliedSuccessfullyMessage: false
            });
          }}>
          Changes applied successfully
        </Notification>
      </div>
    );
  }

  onServiceConfigurationEntryChanged(serviceConfigurationEntry: ServiceConfigurationEntryModel) {
    this._serviceConfigurationEntries.set(serviceConfigurationEntry.service, serviceConfigurationEntry);
    this.setState({
      disableApplyButton: false,
      showChangesAppliedSuccessfullyMessage: false
    });
  }

  onServiceConfigurationEntryValidationChanged(isValid: boolean, service: Service) {
    if (isValid) {
      this._invalidServiceConfigurationEntries.delete(service);
    } else {
      this._invalidServiceConfigurationEntries.set(service, true);
    }
    const isValidOverall = this._invalidServiceConfigurationEntries.size === 0;
    this.setState({
      disableApplyButton: !isValidOverall,
      showChangesAppliedSuccessfullyMessage: false
    });
    this.props.onValidationChange(isValidOverall);
  }

  saveChanges() {
    this.setState({
      showChangesAppliedSuccessfullyMessage: true,
      disableApplyButton: true
    });
    this.props.onChange([...this._serviceConfigurationEntries.values()]);
  }

}
