import * as React from 'react';

import { Service } from '@shared/Service';
import { ServiceConfigurationEntry } from './ServiceConfigurationEntry';
import { ServiceConfigurationEntryModel } from '../../models/ServiceConfigurationEntryModel';
import { BasicButton } from '@shared/buttons';
import { NotificationBanner } from '@shared/notification-banner';

import './ServiceConfiguration.scss';

interface Props {
  services: Service[];
  onServiceConfigurationValidationChanged: (isValid: boolean) => void;
  onServiceConfigurationsChanged: (serviceConfigurationEntryModel: ServiceConfigurationEntryModel[]) => void;
}

interface State {
}

export class ServiceConfiguration extends React.Component<Props, State> {

  private readonly _serviceConfigurationEntries = new Map<Service, ServiceConfigurationEntryModel>();
  private readonly _invalidServiceConfigurationEntries = new Map<Service, true>();

  constructor(props: Props) {
    super(props);

    this.onServiceConfigurationEntryChanged = this.onServiceConfigurationEntryChanged.bind(this);
    this.onServiceConfigurationEntryValidationChanged = this.onServiceConfigurationEntryValidationChanged.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
  }

  render() {
    if (this.props.services.length === 0)
      return (
        <NotificationBanner persistent={true}>
          Unable to fetch services, please refresh your browser
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
    this.props.onServiceConfigurationValidationChanged(
      this._invalidServiceConfigurationEntries.size === 0
    );
  }

  saveChanges() {
    this.props.onServiceConfigurationsChanged([...this._serviceConfigurationEntries.values()]);
  }

}
