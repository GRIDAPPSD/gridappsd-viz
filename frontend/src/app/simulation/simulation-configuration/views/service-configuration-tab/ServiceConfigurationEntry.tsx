import * as React from 'react';

import { FormGroup, Input, CheckBox, TextArea } from '@shared/form';
import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { ServiceConfigurationEntryModel } from '../../models/ServiceConfigurationEntryModel';
import { Validators } from '@shared/form/validation';
import { copyToClipboard } from '@shared/misc';

import './ServiceConfigurationEntry.light.scss';
import './ServiceConfigurationEntry.dark.scss';

interface Props {
  service: Service;
  onChange: (value: ServiceConfigurationEntryModel) => void;
  onValidate: (isValid: boolean, service: Service) => void;
}

interface State {
}

export class ServiceConfigurationEntry extends React.Component<Props, State> {

  serviceConfigurationEntryModel: ServiceConfigurationEntryModel;

  private readonly _invalidFields = new Map<string, true>();

  constructor(props: Props) {
    super(props);

    this.serviceConfigurationEntryModel = this._createServiceConfigurationEntryModel();

    this.onValidate = this.onValidate.bind(this);
  }

  private _createServiceConfigurationEntryModel() {
    return {
      service: this.props.service,
      isValid: true,
      values: Object.keys(this.props.service.user_input)
        .reduce((accumulator, key) => {
          accumulator[key] = this.props.service.user_input[key].default_value;
          return accumulator;
        }, {})
    };
  }

  componentDidMount() {
    if (this.serviceConfigurationEntryModel.values !== null)
      this.props.onChange(this.serviceConfigurationEntryModel);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.service !== prevProps.service) {
      this.serviceConfigurationEntryModel = this._createServiceConfigurationEntryModel();
      this.props.onChange(this.serviceConfigurationEntryModel);
    }
  }

  render() {
    return (
      <FormGroup
        className='service-configuration-tab-entry'
        label={this.props.service.id}>
        {
          Object.entries(this.props.service.user_input)
            .map(([label, userInputSpec]) => (
              <div
                key={label}
                className='service-configuration-tab-entry__value'>
                {this.showUserInputValueFormControl(label, userInputSpec)}
                <Tooltip
                  content={
                    `Example value:\n${userInputSpec.help_example}\n(Click question mark to copy example value to clipboard)`
                  }
                  position='right'>
                  <IconButton
                    className='service-configuration-tab-entry__example'
                    icon='help_outline'
                    size='small'
                    style='accent'
                    onClick={() => copyToClipboard(userInputSpec.help_example)} />
                </Tooltip>
              </div>
            ))
        }
      </FormGroup>
    );
  }

  showUserInputValueFormControl(label: string, userInputSpec: ServiceConfigUserInputSpec) {
    this.serviceConfigurationEntryModel[label] = userInputSpec.default_value;

    switch (userInputSpec.type) {
      case 'float':
        const validators = [
          Validators.checkNotEmpty(`"${label}" must not be empty`),
          Validators.checkValidNumber(`"${label}" must be a number`)
        ];
        const min = userInputSpec.min_value;
        const max = userInputSpec.max_value;
        if (typeof min === 'number')
          validators.push(Validators.checkMin(`"${label}" must be between ${min} and ${max}`, min));
        if (typeof max === 'number')
          validators.push(Validators.checkMax(`"${label}" must be between ${min} and ${max}`, max));
        return (
          <Input
            label={label}
            name={label}
            value={this.serviceConfigurationEntryModel.values[label]}
            hint={userInputSpec.help}
            validators={validators}
            onValidate={this.onValidate}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
      case 'bool':
        return (
          <CheckBox
            label={label}
            name={label}
            value={label}
            checked={this.serviceConfigurationEntryModel.values[label]}
            hint={userInputSpec.help}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
      case 'object':
        return (
          <TextArea
            key={label}
            label={label}
            value={JSON.stringify(this.serviceConfigurationEntryModel.values[label], null, 4)}
            hint={userInputSpec.help}
            validators={[
              Validators.checkNotEmpty(`"${label}" must not be empty`),
              Validators.checkValidJSON(`"${label}" must be a valid JSON`)
            ]}
            onValidate={this.onValidate}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
      default:
        return (
          <Input
            key={label}
            label={label}
            name={label}
            value={this.serviceConfigurationEntryModel.values[label]}
            hint={userInputSpec.help}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
    }
  }

  onValidate(isValid: boolean, fieldName: string) {
    if (!isValid)
      this._invalidFields.set(fieldName, true);
    else
      this._invalidFields.delete(fieldName);
    this.serviceConfigurationEntryModel.isValid = this._invalidFields.size === 0;
    this.props.onValidate(this.serviceConfigurationEntryModel.isValid, this.props.service);
  }

  onValueChanged(label: string, userInputSpec: ServiceConfigUserInputSpec, newValue: any) {
    switch (userInputSpec.type) {
      case 'float':
        this.serviceConfigurationEntryModel.values[label] = +newValue;
        break;
      case 'bool':
        this.serviceConfigurationEntryModel.values[label] = newValue;
        break;
      case 'object':
        this.serviceConfigurationEntryModel.values[label] = JSON.parse(newValue);
        break;
      default:
        this.serviceConfigurationEntryModel.values[label] = newValue;
        break;
    }
    this.props.onChange(this.serviceConfigurationEntryModel);
  }

}
