import * as React from 'react';

import { FormGroup, Input, CheckBox, TextArea } from '@shared/form';
import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { ServiceConfigurationEntryModel } from '../../models/ServiceConfigurationEntryModel';
import { Validators } from '@shared/form/validation';
import { copyToClipboard } from '@shared/misc';

import './ServiceConfigurationEntry.scss';

interface Props {
  service: Service;
  onChange: (value: ServiceConfigurationEntryModel) => void;
  onValidate: (isValid: boolean, service: Service) => void;
}

interface State {
}

export class ServiceConfigurationEntry extends React.Component<Props, State> {

  private readonly _serviceConfigurationEntryModel: ServiceConfigurationEntryModel;
  private readonly _invalidFields = new Map<string, true>();

  constructor(props: Props) {
    super(props);

    this._serviceConfigurationEntryModel = {
      service: this.props.service,
      isValid: true,
      values: Object.keys(props.service.user_input || {})
        .reduce((accumulator, key) => {
          // If accumulator is null, it means, at least one user_input entry's default value
          // is missing, so we don't want to call "onChange" in componentDidMount below
          if (accumulator === null)
            return null;
          const defaultValue = props.service.user_input[key].default_value;
          if (defaultValue !== undefined) {
            accumulator[key] = defaultValue;
            return accumulator;
          }
          return null;
        }, {}) || {}
    };

    this.onValidate = this.onValidate.bind(this);
  }

  componentDidMount() {
    if ('user_input' in this.props.service && this._serviceConfigurationEntryModel.values !== null)
      this.props.onChange(this._serviceConfigurationEntryModel);
  }

  render() {
    if (!('user_input' in this.props.service))
      return null;
    return (
      <FormGroup
        className='service-configuration-entry'
        label={this.props.service.id}>
        {
          Object.entries(this.props.service.user_input)
            .map(([label, userInputSpec]) => (
              <React.Fragment key={label}>
                <div
                  className='service-configuration-entry__value'>
                  {this.showUserInputValueFormControl(label, userInputSpec)}
                  <Tooltip
                    content={
                      `Example value:\n${userInputSpec.help_example}\n(Click to copy example value to clipboard)`
                    }
                    position='right'>
                    <IconButton
                      className='service-configuration-entry__example'
                      icon='help_outline'
                      size='small'
                      style='accent'
                      onClick={() => copyToClipboard(userInputSpec.help_example)} />
                  </Tooltip>
                </div>
                <br />
              </React.Fragment>
            ))
        }
      </FormGroup>
    );
  }

  showUserInputValueFormControl(label: string, userInputSpec: ServiceConfigUserInputSpec) {
    this._serviceConfigurationEntryModel[label] = userInputSpec.default_value;

    switch (userInputSpec.type) {
      case 'float':
        return (
          <Input
            label={label}
            name={label}
            value={userInputSpec.default_value}
            hint={userInputSpec.help}
            validators={[
              Validators.checkNotEmpty(`"${label}" must not be empty`),
              Validators.checkValidNumber(`"${label}" must be a number`)
            ]}
            onValidate={this.onValidate}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
      case 'bool':
        return (
          <CheckBox
            label={label}
            name={label}
            value={label}
            checked={userInputSpec.default_value}
            hint={userInputSpec.help}
            onChange={value => this.onValueChanged(label, userInputSpec, value)} />
        );
      case 'object':
        return (
          <TextArea
            key={label}
            label={label}
            value={JSON.stringify(userInputSpec.default_value, null, 4)}
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
            value={userInputSpec.default_value}
            hint={userInputSpec.help}
            onChange={console.log} />
        );
    }
  }

  onValidate(isValid: boolean, fieldName: string) {
    if (!isValid)
      this._invalidFields.set(fieldName, true);
    else
      this._invalidFields.delete(fieldName);
    this._serviceConfigurationEntryModel.isValid = this._invalidFields.size === 0;
    this.props.onValidate(this._serviceConfigurationEntryModel.isValid, this.props.service);
  }

  onValueChanged(label: string, userInputSpec: ServiceConfigUserInputSpec, value: any) {
    switch (userInputSpec.type) {
      case 'float':
        this._serviceConfigurationEntryModel.values[label] = +value;
        break;
      case 'bool':
        this._serviceConfigurationEntryModel.values[label] = value;
        break;
      case 'object':
        this._serviceConfigurationEntryModel.values[label] = JSON.parse(value);
        break;
    }
  }

}
