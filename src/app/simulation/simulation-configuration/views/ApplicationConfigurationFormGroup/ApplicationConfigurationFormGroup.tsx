import * as React from 'react';

import { FormGroup, Select, TextArea, Option } from '@shared/form';
import { SimulationConfiguration } from '@shared/simulation';
import { Application } from '@shared/Application';
import { ApplicationConfigurationFormGroupValue } from '../../models/ApplicationConfigurationFormGroupValue';

import './ApplicationConfigurationFormGroup.scss';

interface Props {
  currentConfig: SimulationConfiguration;
  onChange: (value: ApplicationConfigurationFormGroupValue) => void;
  availableApplications: Application[];
}

interface State {
  availableApplicationOptions: Option<string>[];
}

export class ApplicationConfigurationFormGroup extends React.Component<Props, State> {
  readonly formValue: ApplicationConfigurationFormGroupValue;

  constructor(props: Props) {
    super(props);

    this.state = {
      availableApplicationOptions: (props.availableApplications || []).map(app => new Option(app.id))
    };

    const previousSelectedApplication = this.props.currentConfig.application_config.applications[0];
    if (previousSelectedApplication)
      this.formValue = {
        applicationId: previousSelectedApplication.name,
        configString: previousSelectedApplication.config_string
      };
    else
      this.formValue = {
        applicationId: '',
        configString: ''
      };
  }

  render() {
    return (
      <FormGroup label=''>
        <Select
          label='Application name'
          options={this.state.availableApplicationOptions}
          onClear={() => {
            this.formValue.applicationId = '';
            this.props.onChange(this.formValue);
          }}
          onChange={options => {
            this.formValue.applicationId = options[0].value;
            this.props.onChange(this.formValue);
          }} />
        <TextArea
          label='Application configuration'
          value={this.formValue.configString}
          onUpdate={value => {
            this.formValue.configString = value;
            this.props.onChange(this.formValue);
          }} />
      </FormGroup>
    );
  }
}