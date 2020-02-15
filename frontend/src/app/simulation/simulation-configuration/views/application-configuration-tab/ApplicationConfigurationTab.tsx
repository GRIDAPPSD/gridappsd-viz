import * as React from 'react';

import { FormGroup, Select, TextArea, SelectionOptionBuilder, FormGroupModel, FormControlModel, FormArrayModel } from '@shared/form';
import { SimulationConfiguration } from '@shared/simulation';
import { Application } from '@shared/Application';
import { Validators } from '@shared/form/validation';
import { ApplicationConfigurationModel } from '../../models/ApplicationConfigurationModel';

import './ApplicationConfigurationTab.light.scss';
import './ApplicationConfigurationTab.dark.scss';

interface Props {
  parentFormGroupModel: FormGroupModel<ApplicationConfigurationModel>;
  applicationConfig: SimulationConfiguration['application_config'];
  availableApplications: Application[];
}

interface State {
  availableApplicationOptionBuilder: SelectionOptionBuilder<string>;
}

export class ApplicationConfigurationTab extends React.Component<Props, State> {

  readonly nameFormControlModel = new FormControlModel('');
  readonly configStringFormControlModel = new FormControlModel(
    '',
    [Validators.checkValidJSON()]
  );

  constructor(props: Props) {
    super(props);

    this.state = {
      availableApplicationOptionBuilder: new SelectionOptionBuilder(
        (props.availableApplications || []).map(app => app.id)
      )
    };

    this._setupFormModel();

  }

  private _setupFormModel() {
    const previousSelectedApplication = this.props.applicationConfig.applications[0];
    if (previousSelectedApplication) {
      this.nameFormControlModel.setValue(previousSelectedApplication.name);
      this.configStringFormControlModel.setValue(previousSelectedApplication.config_string);
    }
    this.props.parentFormGroupModel.setControl(
      'applications',
      new FormArrayModel([
        new FormGroupModel({
          name: this.nameFormControlModel,
          config_string: this.configStringFormControlModel
        })
      ])
    );
  }

  componentDidMount() {
    this.nameFormControlModel.valueChanges()
      .subscribe({
        next: name => {
          if (!name) {
            this.configStringFormControlModel.disable();
          } else {
            this.configStringFormControlModel.enable();
          }
        }
      });
  }

  render() {
    return (
      <FormGroup label=''>
        <Select
          optional
          label='Application name'
          formControlModel={this.nameFormControlModel}
          selectionOptionBuilder={this.state.availableApplicationOptionBuilder}
          selectedOptionFinder={appId => appId === this.nameFormControlModel.getValue()} />
        <TextArea
          label='Application configuration'
          formControlModel={this.configStringFormControlModel} />
      </FormGroup>
    );
  }

}
