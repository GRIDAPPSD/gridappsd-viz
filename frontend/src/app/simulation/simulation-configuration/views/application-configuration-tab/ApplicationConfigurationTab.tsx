import * as React from 'react';

import { FormGroup, Select, TextArea, SelectionOptionBuilder } from '@shared/form';
import { SimulationConfiguration } from '@shared/simulation';
import { Application } from '@shared/Application';
import { ApplicationConfigurationModel } from '../../models/ApplicationConfigurationModel';

import './ApplicationConfigurationTab.light.scss';
import './ApplicationConfigurationTab.dark.scss';

interface Props {
  applicationConfig: SimulationConfiguration['application_config'];
  onChange: (value: ApplicationConfigurationModel) => void;
  availableApplications: Application[];
}

interface State {
  availableApplicationOptionBuilder: SelectionOptionBuilder<string>;
  disabledAppConfigStringInputBox: boolean;
}

export class ApplicationConfigurationTab extends React.Component<Props, State> {
  readonly formValue: ApplicationConfigurationModel;

  constructor(props: Props) {
    super(props);

    this.state = {
      availableApplicationOptionBuilder: new SelectionOptionBuilder(
        (props.availableApplications || []).map(app => app.id)
      ),
      disabledAppConfigStringInputBox: true
    };

    const previousSelectedApplication = this.props.applicationConfig.applications[0];
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
          label='Application name'
          selectionOptionBuilder={this.state.availableApplicationOptionBuilder}
          selectedOptionFinder={appId => appId === this.formValue.applicationId}
          optional={true}
          onClear={this.onApplicationDeselected}
          onChange={this.onSelectedApplicationChanged} />
        <TextArea
          label='Application configuration'
          value={this.formValue.configString}
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

  onSelectedApplicationChanged(selectedAppId: string) {
    this.formValue.applicationId = selectedAppId;
    this.props.onChange(this.formValue);
    this.setState({
      disabledAppConfigStringInputBox: false
    });
  }

}
