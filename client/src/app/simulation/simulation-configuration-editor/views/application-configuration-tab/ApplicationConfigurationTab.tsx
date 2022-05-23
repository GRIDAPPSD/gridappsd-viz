import { Component } from 'react';

import { FormGroup, Select, TextArea, SelectionOptionBuilder, FormGroupModel, FormControlModel, FormArrayModel } from '@client:common/form';
import { Application } from '@client:common/Application';
import { Validators } from '@client:common/form/validation';
import { SimulationConfiguration } from '@client:common/simulation';

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

export class ApplicationConfigurationTab extends Component<Props, State> {

  readonly nameFormControlModel = new FormControlModel('');
  readonly configStringFormControlModel = new FormControlModel(
    '',
    [Validators.checkValidJSON('Application configuration')]
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

  // Todo
  // private _setupFormModel() {
  //   const previousSelectedApplication = this.props.applicationConfig.applications[0];
  //   if (previousSelectedApplication) {
  //     this.nameFormControlModel.setValue(previousSelectedApplication.name);
  //     this.configStringFormControlModel.setValue(previousSelectedApplication.config_string);
  //   }

  //   this.props.parentFormGroupModel.findControl('applications').setValue(this.props.applicationConfig.applications);
  //   console.log('alex=>', this.props.parentFormGroupModel.findControl('applications').getValue());
  // }

  // * Original setup
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
          // eslint-disable-next-line camelcase
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
      <FormGroup
        label=''
        className='application-configuration-tab'>
        <Select
          optional
          label='Application name'
          formControlModel={this.nameFormControlModel}
          selectionOptionBuilder={this.state.availableApplicationOptionBuilder}
          selectedOptionFinder={appId => appId === this.nameFormControlModel.getValue()} />
        <TextArea
          type='plaintext'
          label='Application configuration'
          formControlModel={this.configStringFormControlModel} />
      </FormGroup>
    );
  }

}
