import * as React from 'react';

import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { ServiceConfigurationEntry } from './ServiceConfigurationEntry';
import { ServiceConfigurationEntryModel } from '../../models/ServiceConfigurationEntryModel';
import { BasicButton } from '@shared/buttons';
import { NotificationBanner } from '@shared/notification-banner';

import './ServiceConfiguration.scss';

interface Props {
  services: Service[];
  onValidationChange: (isValid: boolean) => void;
  onChange: (serviceConfigurationEntryModel: ServiceConfigurationEntryModel[]) => void;
}

interface State {
  disableApplyButton: boolean;
  servicesWithUserInput: Service[];
}

export class ServiceConfiguration extends React.Component<Props, State> {

  private readonly _serviceConfigurationEntries = new Map<Service, ServiceConfigurationEntryModel>();
  private readonly _invalidServiceConfigurationEntries = new Map<Service, true>();

  constructor(props: Props) {
    super(props);

    this.state = {
      disableApplyButton: false,
      servicesWithUserInput: props.services.filter(service => 'user_input' in service)
    };

    for (const userInput of this.state.servicesWithUserInput.map(service => service.user_input))
      for (const key in userInput)
        userInput[key].help_example = this._formatUserInputExampleValue(userInput[key]);

    this.onServiceConfigurationEntryChanged = this.onServiceConfigurationEntryChanged.bind(this);
    this.onServiceConfigurationEntryValidationChanged = this.onServiceConfigurationEntryValidationChanged.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
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

  render() {
    if (this.props.services.length === 0)
      return (
        <NotificationBanner persistent={true}>
          Unable to fetch services, please refresh your browser
        </NotificationBanner>
      );
    if (this.state.servicesWithUserInput.length === 0)
      return (
        <NotificationBanner persistent={true}>
          No services with user_input found
        </NotificationBanner>
      );
    return (
      <div className='service-configuration'>
        {
          this.props.services.map(service => (
            <ServiceConfigurationEntry
              key={service.id}
              service={service}
              onChange={this.onServiceConfigurationEntryChanged}
              onValidate={this.onServiceConfigurationEntryValidationChanged} />
          ))
        }
        <BasicButton
          className='service-configuration__apply'
          label='Apply'
          type='positive'
          disabled={this.state.disableApplyButton}
          onClick={this.saveChanges} />
      </div>
    );
  }

  onServiceConfigurationEntryChanged(serviceConfigurationEntry: ServiceConfigurationEntryModel) {
    this._serviceConfigurationEntries.set(serviceConfigurationEntry.service, serviceConfigurationEntry);
  }

  onServiceConfigurationEntryValidationChanged(isValid: boolean, service: Service) {
    if (isValid)
      this._invalidServiceConfigurationEntries.delete(service);
    else
      this._invalidServiceConfigurationEntries.set(service, true);
    const isValidOverall = this._invalidServiceConfigurationEntries.size === 0;
    this.setState({
      disableApplyButton: !isValidOverall
    });
    this.props.onValidationChange(isValidOverall);
  }

  saveChanges() {
    this.props.onChange([...this._serviceConfigurationEntries.values()]);
  }

}
