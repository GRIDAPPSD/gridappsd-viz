import * as React from 'react';

import { FormGroup, Select, TextArea, Option } from '@shared/form';
import { SimulationConfiguration } from '@shared/simulation';
import { Application } from '@shared/Application';
import { ApplicationConfigurationFormGroupValue } from '../../models/ApplicationConfigurationFormGroupValue';
import { Validators } from '@shared/form/validation';

import './ApplicationConfigurationFormGroup.scss';

interface Props {
  currentConfig: SimulationConfiguration;
  onChange: (value: ApplicationConfigurationFormGroupValue) => void;
  availableApplications: Application[];
}

interface State {
  availableApplicationOptions: Option<string>[];
  disabledAppConfigStringInputBox: boolean;
}

export class ApplicationConfigurationFormGroup extends React.Component<Props, State> {
  readonly formValue: ApplicationConfigurationFormGroupValue;

  constructor(props: Props) {
    super(props);

    this.state = {
      availableApplicationOptions: (props.availableApplications || []).map(app => new Option(app.id)),
      disabledAppConfigStringInputBox: true
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

    this.onApplicationDeselected = this.onApplicationDeselected.bind(this);
    this.onSelectedApplicationChanged = this.onSelectedApplicationChanged.bind(this);
  }

  render() {
    return (
      <FormGroup label=''>
        <Select
          multiple={false}
          label='Application name'
          options={this.state.availableApplicationOptions}
          optional={true}
          onClear={this.onApplicationDeselected}
          onChange={this.onSelectedApplicationChanged} />
        <TextArea
          label='Application configuration'
          value={this.formValue.configString}
          validators={[
            Validators.checkNotEmpty('Application config string is empty')
          ]}
          disabled={this.state.disabledAppConfigStringInputBox}
          onChange={value => {
            this.formValue.configString = value;
            this.props.onChange(this.formValue);
          }} />
      </FormGroup>
    );
  }

  onApplicationDeselected() {
    this.formValue.applicationId = '';
    this.props.onChange(this.formValue);
    this.setState({
      disabledAppConfigStringInputBox: true
    });
  }

  onSelectedApplicationChanged(selectedOption: Option<string>) {
    this.formValue.applicationId = selectedOption.value;
    this.props.onChange(this.formValue);
    this.setState({
      disabledAppConfigStringInputBox: false
    });
  }
}