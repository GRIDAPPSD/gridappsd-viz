import * as React from 'react';

import {
  FormGroup,
  Input,
  Select,
  Checkbox,
  TextArea,
  SelectionOptionBuilder,
  FormGroupModel,
  FormControlModel
} from '@shared/form';
import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';
import { SimulationConfigurationTabModel } from '../../models/SimulationConfigurationTabModel';
import { SimulationConfiguration } from '@shared/simulation';
import { Validators } from '@shared/form/validation';

import './SimulationConfigurationTab.light.scss';
import './SimulationConfigurationTab.dark.scss';

interface Props {
  parentFormGroupModel: FormGroupModel<SimulationConfigurationTabModel>;
  simulationConfig: SimulationConfiguration['simulation_config'];
}

interface State {
  simulatorOptionBuilder: SelectionOptionBuilder<string>;
}

export class SimulationConfigurationTab extends React.Component<Props, State> {

  readonly modelConfigurationModelFormControlModel: FormControlModel<string>;

  constructor(props: Props) {
    super(props);

    this.state = {
      simulatorOptionBuilder: new SelectionOptionBuilder([props.simulationConfig.simulator || 'GridLAB-D'])
    };

    this._setupFormGroupModelForSimulationConfigurationTab();

    this.modelConfigurationModelFormControlModel = new FormControlModel(
      JSON.stringify(this.props.simulationConfig.model_creation_config, null, 4),
      [
        Validators.checkNotEmpty('Model creation config'),
        Validators.checkValidJSON()
      ]
    );
  }

  private _setupFormGroupModelForSimulationConfigurationTab() {
    this.props.parentFormGroupModel.setControl(
      'start_time',
      new FormControlModel(
        this.props.simulationConfig.start_time,
        [Validators.checkNotEmpty('Start time'), Validators.checkValidDateTime('Start time')]
      )
    );
    this.props.parentFormGroupModel.setControl(
      'duration',
      new FormControlModel(
        this.props.simulationConfig.duration,
        [Validators.checkNotEmpty('Duration'), Validators.checkValidNumber('Duration')]
      )
    );
    this.props.parentFormGroupModel.setControl(
      'simulator',
      new FormControlModel('')
    );
    this.props.parentFormGroupModel.setControl(
      'run_realtime',
      new FormControlModel(this.props.simulationConfig.run_realtime)
    );
    this.props.parentFormGroupModel.setControl(
      'simulation_name',
      new FormControlModel(
        this.props.simulationConfig.simulation_name,
        [Validators.checkNotEmpty('Simulation name')]
      )
    );
    this.props.parentFormGroupModel.setValue({
      'model_creation_config': this.props.simulationConfig.model_creation_config
    });
  }

  componentDidMount() {
    this.modelConfigurationModelFormControlModel.valueChanges()
      .subscribe({
        next: value => {
          if (this.modelConfigurationModelFormControlModel.isValid()) {
            this.props.parentFormGroupModel.setValue({
              'model_creation_config': JSON.parse(value)
            });
          }
        }
      });
    this.modelConfigurationModelFormControlModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.props.parentFormGroupModel.setValidity(isValid);
        }
      });
  }

  componentWillUnmount() {
    this.modelConfigurationModelFormControlModel.cleanup();
  }

  render() {
    return (
      <FormGroup label=''>
        <Input
          label='Start time'
          formControlModel={this.props.parentFormGroupModel.findControl('start_time')} />

        <Input
          label='Duration'
          hint='Seconds'
          formControlModel={this.props.parentFormGroupModel.findControl('duration')} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Select
            label='Simulator'
            formControlModel={this.props.parentFormGroupModel.findControl('simulator')}
            selectionOptionBuilder={this.state.simulatorOptionBuilder}
            selectedOptionFinder={simulator => simulator === 'GridLAB-D'} />
          <div className='accompanying-text'>
            <div>Power flow solver method</div>
            <div>NR</div>
          </div>
        </div>

        <div className='realtime-checkbox-container'>
          <Checkbox
            label='Real time'
            name='realtime'
            formControlModel={this.props.parentFormGroupModel.findControl('run_realtime')} />
          <Tooltip
            position='right'
            content={
              <>
                <div>Checked: Run in real time. Slower than simulation time</div>
                <div>Unchecked: Run in simulation time. Faster than real time</div>
              </>
            }>
            <IconButton
              icon='help_outline'
              style='accent'
              size='small' />
          </Tooltip>
        </div>

        <Input
          label='Simulation name'
          formControlModel={this.props.parentFormGroupModel.findControl('simulation_name')} />

        <TextArea
          label='Model creation configuration'
          formControlModel={this.modelConfigurationModelFormControlModel} />
      </FormGroup>
    );
  }

}
