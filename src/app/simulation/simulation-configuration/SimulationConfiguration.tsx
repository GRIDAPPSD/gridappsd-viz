import * as React from 'react';

import { FormGroup } from '../../shared/views/form/form-group/FormGroup';
import { FormControl } from '../../shared/views/form/form-control/FormControl';
import { SimulationConfig } from '../../models/SimulationConfig';
import { BasicButton } from '../../shared/views/buttons/basic-button/BasicButton';
import { PopUp } from '../../shared/views/pop-up/PopUp';
import { MenuItem } from '../../shared/views/dropdown-menu/MenuItem';
import { SelectFormControl } from '../../shared/views/form/select-form-control/SelectFormControl';
import { CheckBox } from '../../shared/views/form/checkbox/CheckBox';
import { MultilineFormControl } from '../../shared/views/form/multiline-form-control/MultilineFormControl';
import { SIMULATION_CONFIG_OPTIONS } from './models/simulation-config-options';
import { FeederModels } from '../../models/FeederModels';

import './SimulationConfiguration.scss';
import { Tooltip } from '../../shared/views/tooltip/Tooltip';
import { IconButton } from '../../shared/views/buttons/icon-button/IconButton';

interface Props {
  onSubmit: (configObject: SimulationConfig) => void;
  onMRIDChanged: (mRID: string, simulationName: string) => void;
  onClose: (event) => void;
  initialConfig: SimulationConfig;
  feederModels: FeederModels;
}

interface State {
  show: boolean;
}

export class SimulationConfiguration extends React.Component<Props, State> {

  private _currentConfig: SimulationConfig;

  constructor(props: any) {
    super(props);
    this.state = {
      show: true
    };

    this._currentConfig = JSON.parse(JSON.stringify(this.props.initialConfig));
  }

  render() {
    return (
      <PopUp in={this.state.show}>
        <div className='simulation-configuration'>
          <div className='simulation-configuration__body'>
            <form>
              <FormGroup label='Power System Configuration'>
                <SelectFormControl
                  label='Geographical region name'
                  menuItems={this.props.feederModels.regions.map(region => new MenuItem(region.regionName, region.regionID))}
                  defaultSelectedIndex={
                    (this.props.feederModels.regions
                      .filter(region => region.regionID === this._currentConfig.power_system_config.GeographicalRegion_name)[0] || { index: 0 }).index
                  }
                  onChange={item => this._currentConfig.power_system_config.GeographicalRegion_name = item.value} />

                <SelectFormControl
                  label='Sub-geographical region name'
                  menuItems={
                    this.props.feederModels.subregions.map(subregion => new MenuItem(subregion.subregionName, subregion.subregionID))
                  }
                  defaultSelectedIndex={
                    (this.props.feederModels.subregions
                      .filter(subregion => subregion.subregionID === this._currentConfig.power_system_config.SubGeographicalRegion_name)[0] || { index: 0 }).index
                  }
                  onChange={item => this._currentConfig.power_system_config.SubGeographicalRegion_name = item.value} />

                <SelectFormControl
                  label='Line name'
                  menuItems={this.props.feederModels.lines.map(line => new MenuItem(line.name, line.mRID))}
                  defaultSelectedIndex={
                    (this.props.feederModels.lines
                      .filter(line => line.mRID === this._currentConfig.power_system_config.Line_name)[0] || { index: 0 }).index
                  }
                  onChange={item => {
                    this._currentConfig.power_system_config.Line_name = item.value;
                    this.props.onMRIDChanged(item.value, this._currentConfig.simulation_config.simulation_name);
                  }} />
              </FormGroup>

              <FormGroup label='Simulation Configuration'>
                <FormControl
                  label='Start time'
                  hint='YYYY-MM-DD HH:MM:SS'
                  name='start_time'
                  value={this._currentConfig.simulation_config.start_time}
                  onUpdate={value => this._currentConfig.simulation_config.start_time = value}
                />
                <FormControl
                  label='Duration'
                  hint='Seconds'
                  type='number'
                  name='duration'
                  value={this._currentConfig.simulation_config.duration}
                  onUpdate={value => this._currentConfig.simulation_config.duration = value}
                />
                <div style={{ position: 'relative' }}>
                  <SelectFormControl
                    label='Simulator'
                    menuItems={SIMULATION_CONFIG_OPTIONS.simulation_config.simulators.map(e => new MenuItem(e, e))}
                    onChange={item => this._currentConfig.simulation_config.simulator = item.value}
                    defaultSelectedIndex={
                      SIMULATION_CONFIG_OPTIONS.simulation_config.simulators
                        .indexOf(this._currentConfig.simulation_config.simulator)
                    } />
                  <div style={{ position: 'absolute', top: 0, left: '48%', fontSize: '13px' }}>
                    <div style={{ fontWeight: 'bold' }}>Power flow solver method</div>
                    <div>NR</div>
                  </div>
                </div>
                <div className='realtime-checkbox-container'>
                  <CheckBox
                    label='Real time'
                    name='realtime'
                    checked={this._currentConfig.simulation_config.realtime}
                    onChange={state => this._currentConfig.simulation_config.realtime = state} />
                  <Tooltip
                    position='right'
                    content={
                      <>
                        <div>Checked: Run in real time. Slower than simulation time</div>
                        <div>Unchecked: Run in simulation time. Faster than real time</div>
                      </>
                    }>
                    <IconButton icon='question' />
                  </Tooltip>
                </div>

                <FormControl
                  label='Simulation name'
                  name='simulation_name'
                  value={this._currentConfig.simulation_config.simulation_name}
                  onUpdate={value => this._currentConfig.simulation_config.simulation_name = value} />

                <MultilineFormControl
                  label='Model creation configuration'
                  value={JSON.stringify(this._currentConfig.simulation_config.model_creation_config, null, 4)}
                  onUpdate={value => this._currentConfig.simulation_config.model_creation_config = JSON.parse(value)} />
              </FormGroup>

              <FormGroup label='Application Configuration'>
                <SelectFormControl
                  label='Application name'
                  // 0 is the index of this app inside SimulationConfig.application_config.applications array
                  // new MenuItem('VVO', { index: 0, name: 'vvo' }),
                  menuItems={[new MenuItem('Sample App', { index: 0, name: 'sample_app' })]}
                  onChange={menuItem => {
                    if (SIMULATION_CONFIG_OPTIONS.application_config.applications[menuItem.value.index].config_string !== '') {
                      const configStr = JSON.stringify(
                        JSON.parse(SIMULATION_CONFIG_OPTIONS.application_config.applications[menuItem.value.index].config_string),
                        null,
                        4
                      );
                      this._currentConfig.application_config.applications = [{ name: menuItem.value.name, config_string: configStr }];
                    }
                  }}
                  defaultSelectedIndex={
                    SIMULATION_CONFIG_OPTIONS.application_config.applications
                      .findIndex(value => value.name === this._currentConfig.application_config.applications[0].name)
                  } />
              </FormGroup>
            </form>
          </div>
          <footer className='simulation-configuration__actions'>
            <BasicButton
              className='simulation-configuration__actions__cancel'
              label='Cancel'
              type='negative'
              onClick={event => {
                event.stopPropagation();
                this.props.onClose(event);
                this.setState({ show: false });
              }} />
            <BasicButton
              label='Submit'
              type='positive'
              onClick={event => {
                event.stopPropagation();
                this.setState({ show: false });
                this.props.onSubmit(this._currentConfig);
              }} />
          </footer>
        </div>
      </PopUp>
    );
  }
}