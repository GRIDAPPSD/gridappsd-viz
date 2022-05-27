import { Component } from 'react';

import {
  FormGroup,
  Input,
  Select,
  Checkbox,
  TextArea,
  SelectionOptionBuilder,
  FormGroupModel,
  FormControlModel
} from '@client:common/form';
import { Tooltip } from '@client:common/tooltip';
import { IconButton } from '@client:common/buttons';
import { Validators } from '@client:common/form/validation';
import { SimulationConfiguration } from '@client:common/simulation';
import { Service } from '@client:common/Service';
import { DateTimeService } from '@client:common/DateTimeService';

import { SimulationConfigurationTabModel } from '../../models/SimulationConfigurationTabModel';

import './SimulationConfigurationTab.light.scss';
import './SimulationConfigurationTab.dark.scss';

interface Props {
  parentFormGroupModel: FormGroupModel<SimulationConfigurationTabModel>;
  simulationConfig: SimulationConfiguration['simulation_config'];
  simulators: string[];
  services: Service[];
  isUploaded: boolean;
}

interface State {
  simulatorOptionBuilder: SelectionOptionBuilder<string>;
}

export class SimulationConfigurationTab extends Component<Props, State> {

  readonly dateTimeService = DateTimeService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      // simulatorOptionBuilder: new SelectionOptionBuilder([props.simulationConfig.simulator || 'GridLAB-D'])
      simulatorOptionBuilder: new SelectionOptionBuilder(props.simulators)
    };

    this._setupFormGroupModelForSimulationConfigurationTab();

  }

  componentDidUpdate(prevProps: Props) {

    const servicesAsSimulator = this.props.services.filter(service => service.category === 'SIMULATOR');
    // const servicesAsSimulator = this.props.services.filter(service => 'category' as "SIMULATOR" in service);
    if (this.props.services !== prevProps.services) {
      this.setState({
        simulatorOptionBuilder: new SelectionOptionBuilder(servicesAsSimulator.map(service => service.id))
      });
    }
  }

  private _setupFormGroupModelForSimulationConfigurationTab() {
    if (this.props.simulationConfig && this.props.simulationConfig !== null) {
      if (this.props.isUploaded) {
        this.props.parentFormGroupModel.setControl(
          'start_time',
          new FormControlModel(
            this.dateTimeService.parseEpoch(+this.props.simulationConfig.start_time),
            [Validators.checkNotEmpty('Start time'), Validators.checkValidDateTime('Start time')]
          )
        );
      } else {
        this.props.parentFormGroupModel.setControl(
          'start_time',
          new FormControlModel(
            this.props.simulationConfig.start_time,
            [Validators.checkNotEmpty('Start time'), Validators.checkValidDateTime('Start time')]
          )
        );
      }
      this.props.parentFormGroupModel.setControl(
        'duration',
        new FormControlModel(
          this.props.simulationConfig.duration,
          [Validators.checkNotEmpty('Duration'), Validators.checkValidNumber('Duration')]
        )
      );
      this.props.parentFormGroupModel.setControl(
        'simulator',
        // new FormControlModel('')
        new FormControlModel(this.props.simulationConfig.simulator)
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
      this.props.parentFormGroupModel.setControl(
        'model_creation_config',
        new FormControlModel(
          this.props.simulationConfig.model_creation_config,
          [
            Validators.checkNotEmpty('Model creation config'),
            Validators.checkValidJSON('Model creation config')
          ]
        )
      );
    }
  }

  render() {
    return (
      <FormGroup
        label=''
        className='simulation-configuration-tab'>
        <Input
          label='Start time'
          hint='YYYY-MM-DD HH:MM:SS'
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
            // selectedOptionFinder={simulator => simulator === 'GridLAB-D'} />
            selectedOptionFinder={simulator => simulator === this.props.simulationConfig.simulator} />
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
          formControlModel={this.props.parentFormGroupModel.findControl('model_creation_config')} />
      </FormGroup>
    );
  }

}
