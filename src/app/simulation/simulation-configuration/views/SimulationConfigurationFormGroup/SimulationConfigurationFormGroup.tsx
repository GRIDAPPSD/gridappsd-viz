import * as React from 'react';

import { FormGroup, Input, Select, CheckBox, TextArea, Option } from '@shared/form';
import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';
import { SimulationConfigurationFormGroupValue } from '../../models/SimulationConfigurationFormGroupValue';
import { SimulationConfiguration } from '@shared/simulation';
import { Validators } from '@shared/form/validation';

import './SimulationConfigurationFormGroup.scss';

interface Props {
  onChange: (formValue: SimulationConfigurationFormGroupValue) => void;
  currentConfig: SimulationConfiguration;
  simulationName: string;
}

interface State {
  simulatorOptions: Option<string>[];
}

export class SimulationConfigurationFormGroup extends React.Component<Props, State> {
  readonly formValue: SimulationConfigurationFormGroupValue;

  private _invalidFormControls = new Map<string, true>();

  constructor(props: Props) {
    super(props);
    this.state = {
      simulatorOptions: [
        new Option('GridLAB-D', 'GridLAB-D')
      ]
    };

    this.formValue = {
      startDateTime: props.currentConfig.simulation_config.start_time,
      duration: props.currentConfig.simulation_config.duration,
      runInRealtime: props.currentConfig.simulation_config.run_realtime,
      simulationName: props.currentConfig.simulation_config.simulation_name,
      simulator: props.currentConfig.simulation_config.simulator,
      modelCreationConfig: props.currentConfig.simulation_config.model_creation_config,
      isValid: true
    };

    this.updateInvalidFormControlsMap = this.updateInvalidFormControlsMap.bind(this);
    this.onStartDateTimeChanged = this.onStartDateTimeChanged.bind(this);
    this.onDurationChanged = this.onDurationChanged.bind(this);
    this.onSimulatorSelectionCleared = this.onSimulatorSelectionCleared.bind(this);
    this.onSimulatorChanged = this.onSimulatorChanged.bind(this);
    this.onRunInRealtimeChanged = this.onRunInRealtimeChanged.bind(this);
    this.onSimulationNameChanged = this.onSimulationNameChanged.bind(this);
    this.onModelCreationConfigurationChanged = this.onModelCreationConfigurationChanged.bind(this);
  }

  render() {
    return (
      <FormGroup label=''>
        <Input
          label='Start time'
          hint='YYYY-MM-DD HH:MM:SS'
          name='start_time'
          value={this.formValue.startDateTime}
          validators={[
            Validators.checkNotEmpty('Start time is empty'),
            Validators.checkValidDateTime('Start time must have format YYYY-MM-DD HH:MM:SS')
          ]}
          onValidate={this.updateInvalidFormControlsMap}
          onChange={this.onStartDateTimeChanged} />
        <Input
          label='Duration'
          hint='Seconds'
          name='duration'
          value={this.formValue.duration}
          validators={[
            Validators.checkNotEmpty('Duration is empty'),
            Validators.checkValidNumber('Duration is not a number')
          ]}
          onValidate={this.updateInvalidFormControlsMap}
          onChange={this.onDurationChanged} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Select
            multiple={false}
            label='Simulator'
            options={this.state.simulatorOptions}
            isOptionSelected={option => option.value === 'GridLAB-D'}
            onClear={this.onSimulatorSelectionCleared}
            onChange={this.onSimulatorChanged} />
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
            onChange={this.onRunInRealtimeChanged} />
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
          validators={[
            Validators.checkNotEmpty('Simulation name is empty')
          ]}
          value={this.props.simulationName}
          onValidate={this.updateInvalidFormControlsMap}
          onChange={this.onSimulationNameChanged} />

        <TextArea
          label='Model creation configuration'
          value={JSON.stringify(this.formValue.modelCreationConfig, null, 4)}
          validators={[
            Validators.checkNotEmpty('Model creation configuration is empty'),
            Validators.checkValidJSON()
          ]}
          onValidate={this.updateInvalidFormControlsMap}
          onChange={this.onModelCreationConfigurationChanged} />
      </FormGroup>
    );
  }

  updateInvalidFormControlsMap(isValid: boolean, formControlLabel: string) {
    if (isValid)
      this._invalidFormControls.delete(formControlLabel);
    else
      this._invalidFormControls.set(formControlLabel, true);
    this.formValue.isValid = this._invalidFormControls.size === 0;
    // If validation was not valid, then notify the parent
    if (!isValid)
      this.props.onChange(this.formValue);
  }

  onStartDateTimeChanged(value: string) {
    this.formValue.startDateTime = value;
    this.props.onChange(this.formValue);
  }

  onDurationChanged(value: string) {
    this.formValue.duration = value;
    this.props.onChange(this.formValue);
  }

  onSimulatorSelectionCleared(formControlLabel: string) {
    this.formValue.simulator = '';
    this.updateInvalidFormControlsMap(false, formControlLabel);
  }

  onSimulatorChanged(selectedOption: Option<string>, formControlLabel: string) {
    this.formValue.simulator = selectedOption.value;
    this.updateInvalidFormControlsMap(true, formControlLabel);
    this.props.onChange(this.formValue);
  }

  onRunInRealtimeChanged(state: boolean) {
    this.formValue.runInRealtime = state;
    this.props.onChange(this.formValue);
  }

  onSimulationNameChanged(value: string) {
    this.formValue.simulationName = `[NEW]${value}`;
    this.props.onChange(this.formValue);
  }

  onModelCreationConfigurationChanged(value: string) {
    this.formValue.modelCreationConfig = JSON.parse(value);
    this.props.onChange(this.formValue);
  }

}
