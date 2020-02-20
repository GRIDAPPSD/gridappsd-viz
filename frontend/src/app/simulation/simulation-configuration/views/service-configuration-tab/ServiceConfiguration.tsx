import * as React from 'react';

import { FormGroup, Input, Checkbox, TextArea, FormArrayModel, FormGroupModel, FormControlModel } from '@shared/form';
import { Service, ServiceConfigUserInputSpec } from '@shared/Service';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { ServiceConfigurationModel } from '../../models/ServiceConfigurationModel';
import { Validators, Validator } from '@shared/form/validation';
import { copyToClipboard } from '@shared/misc';

import './ServiceConfiguration.light.scss';
import './ServiceConfiguration.dark.scss';

interface Props {
  parentFormArrayModel: FormArrayModel<ServiceConfigurationModel>;
  service: Service;
}

interface State {
}

export class ServiceConfiguration extends React.Component<Props, State> {

  readonly userInputOptionsFormGroupModel = new FormGroupModel<{ [optionLabel: string]: any }>();

  constructor(props: Props) {
    super(props);

    this._setupServiceConfigurationFormModel();
  }

  private _setupServiceConfigurationFormModel() {
    this._buildFormGroupModelForUserOptions();
    this.props.parentFormArrayModel.pushControl(
      new FormGroupModel({
        id: this.props.service.id,
        user_options: this.userInputOptionsFormGroupModel
      })
    );
  }

  private _buildFormGroupModelForUserOptions() {
    for (const [optionLabel, userInputSpec] of Object.entries(this.props.service.user_input)) {
      this.userInputOptionsFormGroupModel.setControl(
        optionLabel,
        new FormControlModel(
          this._formatDefaultValue(userInputSpec),
          this._resolveValidatorsForUserInputSpec(optionLabel, userInputSpec)
        )
      );
    }
  }

  private _formatDefaultValue(userInputSpec: ServiceConfigUserInputSpec) {
    if (userInputSpec.type === 'object') {
      return JSON.stringify(userInputSpec.default_value, null, 4);
    }
    return userInputSpec.default_value;
  }

  private _resolveValidatorsForUserInputSpec(label: string, userInputSpec: ServiceConfigUserInputSpec) {
    const validators = [] as Validator[];
    switch (userInputSpec.type) {
      case 'float':
      case 'int':
        validators.push(
          Validators.checkNotEmpty(label),
          Validators.checkValidNumber(label)
        );
        const min = userInputSpec.min_value;
        const max = userInputSpec.max_value;
        if (typeof min === 'number') {
          if (typeof max === 'number') {
            validators.push(Validators.checkBetween(label, min, max));
          } else {
            validators.push(Validators.checkMin(label, min));
          }
        } else if (typeof max === 'number') {
          validators.push(Validators.checkMax(label, max));
        }
        break;
      case 'object':
        validators.push(
          Validators.checkNotEmpty(label),
          Validators.checkValidJSON(label)
        );
        break;
    }
    return validators;
  }

  render() {
    return (
      <FormGroup
        className='service-configuration'
        label={this.props.service.id}>
        {
          Object.entries(this.props.service.user_input)
            .map(([label, userInputSpec]) => (
              <div
                key={label}
                className='service-configuration__user-option'>
                {this.showUserInputOptionFormControl(label, userInputSpec)}
                <Tooltip
                  content={
                    `Example value:\n${userInputSpec.help_example}\n(Click question mark to copy example value to clipboard)`
                  }
                  position='right'>
                  <IconButton
                    className='service-configuration__user-option__example'
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

  showUserInputOptionFormControl(label: string, userInputSpec: ServiceConfigUserInputSpec) {
    const formControlModel = this.userInputOptionsFormGroupModel.findControl(label);
    switch (userInputSpec.type) {
      case 'float':
      case 'int':
        return (
          <Input
            label={label}
            type='number'
            formControlModel={formControlModel}
            hint={userInputSpec.help} />
        );
      case 'bool':
        return (
          <Checkbox
            label={label}
            name={label}
            hint={userInputSpec.help}
            formControlModel={formControlModel} />
        );
      case 'object':
        return (
          <TextArea
            key={label}
            label={label}
            hint={userInputSpec.help}
            formControlModel={formControlModel} />
        );
      default:
        return (
          <Input
            key={label}
            label={label}
            formControlModel={formControlModel}
            hint={userInputSpec.help} />
        );
    }
  }

}
