import * as React from 'react';

import { FormGroup, Input, Select, CheckBox, TextArea, Option } from '@shared/form';
import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';
import { SimulationConfigurationFormGroupValue } from '../../models/SimulationConfigurationFormGroupValue';
import { SimulationConfiguration } from '@shared/simulation';

import './SimulationConfigurationFormGroup.scss';

interface Props {
  onChange: (formValue: SimulationConfigurationFormGroupValue) => void;
  currentConfig: SimulationConfiguration;
}

interface State {
  simulationName: string;
  simulatorOptions: Option<string>[];
}

export class SimulationConfigurationFormGroup extends React.Component<Props, State> {
  readonly formValue: SimulationConfigurationFormGroupValue;

  constructor(props: Props) {
    super(props);
    this.state = {
      simulationName: props.currentConfig.simulation_config.simulation_name,
      simulatorOptions: [
        new Option('GridLAB-D', 'GridLAB-D')
      ]
    };

    this.formValue = {
      startTime: props.currentConfig.simulation_config.start_time,
      duration: props.currentConfig.simulation_config.duration,
      runInRealtime: props.currentConfig.simulation_config.run_realtime,
      simulationName: props.currentConfig.simulation_config.simulation_name,
      simulator: props.currentConfig.simulation_config.simulator,
      modelCreationConfig: props.currentConfig.simulation_config.model_creation_config
    };
  }

  render() {
    return (
      <FormGroup label=''>
        <Input
          label='Start time'
          hint='YYYY-MM-DD HH:MM:SS'
          name='start_time'
          value={this.formValue.startTime}
          onChange={value => {
            this.formValue.startTime = value;
            this.props.onChange(this.formValue);
          }} />
        <Input
          label='Duration'
          hint='Seconds'
          type='number'
          name='duration'
          value={this.formValue.duration}
          onChange={value => {
            this.formValue.duration = value;
            this.props.onChange(this.formValue);
          }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Select
            multiple={false}
            label='Simulator'
            options={this.state.simulatorOptions}
            isOptionSelected={option => option.value === 'GridLAB-D'}
            onChange={selectedOption => {
              this.formValue.simulator = selectedOption.value;
              this.props.onChange(this.formValue);
            }} />
          <div style={{ fontSize: '13px' }}>
            <div style={{ fontWeight: 'bold' }}>Power flow solver method</div>
            <div>NR</div>
          </div>
        </div>
        <div className='realtime-checkbox-container'>
          <CheckBox
            label='Real time'
            name='realtime'
            checked={this.formValue.runInRealtime}
            onChange={state => {
              this.formValue.runInRealtime = state;
              this.props.onChange(this.formValue);
            }} />
          <Tooltip
            position='right'
            content={
              <>
                <div>Checked: Run in real time. Slower than simulation time</div>
                <div>Unchecked: Run in simulation time. Faster than real time</div>
              </>
            }>
            <IconButton
              icon='help'
              size='small' />
          </Tooltip>
        </div>

        <Input
          label='Simulation name'
          name='simulation_name'
          value={this.state.simulationName}
          onChange={value => {
            this.formValue.simulationName = value;
            this.props.onChange(this.formValue);
          }} />

        <TextArea
          label='Model creation configuration'
          value={JSON.stringify(this.formValue.modelCreationConfig, null, 4)}
          onUpdate={value => {
            this.formValue.modelCreationConfig = JSON.parse(value);
            this.props.onChange(this.formValue);
          }} />
      </FormGroup>
    );
  }
}