import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { StompSubscription } from '@stomp/stompjs';

import { DropdownMenu } from '../dropdown-menu/DropdownMenu';
import { MenuItem } from '../dropdown-menu/MenuItem';
import {
  SetGeographicalRegionName, SetSubGeographicalRegionName, SetLineName, SetSimulator, SetSimulationName,
  UpdateApplicationConfiguration, StoreMRIDs, SetDuration, SetStartTime, ToggleRealtime
} from './simulation-config-form-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { AppState } from '../../models/AppState';
import { SIMULATION_CONFIG_OPTIONS } from '../../models/simulation-config-options';
import { MessageService } from '../../services/MessageService';
import { GetAllFeederModelsRequestPayload } from '../../models/message-requests/GetAllFeederModelsRequest';
import { CheckBox } from '../checkbox/CheckBox';
import { Tooltip } from '../tooltip/Tooltip';

import './SimulationConfigForm.styles.scss';

interface Props {
  onSubmit: (SimulationConfig: SimulationConfig) => void;
  dispatch: any;
  activeSimulationConfig: SimulationConfig;
  show: boolean;
}

interface State {
  selectedAppName: string;
  appConfigStr: string;
  regions: Array<{ regionName: string; regionID: string; index: number }>;
  subregions: Array<{ subregionName: string; subregionID: string; index: number }>;
  lines: Array<{ name: string; mRID: string; index: number }>;
  showRealtimeHint: boolean;
}

const mapStateToProps = (state: AppState): Props => {
  return {
    activeSimulationConfig: state.activeSimulationConfig
  } as Props;
}

export const SimulationConfigForm = connect(mapStateToProps)(class SimulationConfigFormContainer extends React.Component<Props, State> {

  private readonly _messageService: MessageService = MessageService.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
      selectedAppName: '',
      appConfigStr: props.activeSimulationConfig.application_config.applications[0].config_string,
      regions: [],
      subregions: [],
      lines: [],
      showRealtimeHint: false
    }
  }

  componentDidMount() {
    this._fetchDataToPopulateForm();
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props !== newProps) {
      this.setState({
        appConfigStr: newProps.activeSimulationConfig.application_config.applications[0].config_string
      });
    }
  }
  render() {
    if (this.state.regions.length > 0 && this.state.subregions.length > 0 && this.state.subregions.length > 0) {
      const { dispatch, activeSimulationConfig, show } = this.props;
      const { regions, subregions, lines } = this.state;
      return (
        <form style={{ display: show ? 'block' : 'none' }} className='simulation-config-form'>
          <div className='simulation-config-form__group'>
            <header className='simulation-config-form__group__heading'>Power System Configuration</header>
            <div className='gridappsd-form-controls'>
              <div className='gridappsd-form-control'>
                <label className='gridappsd-form-control__label'>Geographical Region Name</label>
                <DropdownMenu
                  menuItems={regions.map(region => new MenuItem(region.regionName, region.regionID))}
                  onChange={menuItem => {
                    dispatch(new SetGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={
                    (regions.filter(region => region.regionID === activeSimulationConfig.power_system_config.GeographicalRegion_name)[0] || { index: 0 }).index
                  }
                />
              </div>
              <div className='gridappsd-form-control'>
                <label className='gridappsd-form-control__label'>SubGeographical Region Name</label>
                <DropdownMenu
                  menuItems={subregions.map(subregion => new MenuItem(subregion.subregionName, subregion.subregionID))}
                  onChange={menuItem => {
                    dispatch(new SetSubGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={
                    (subregions.filter(subregion => subregion.subregionID === activeSimulationConfig.power_system_config.SubGeographicalRegion_name)[0] || { index: 0 }).index
                  }
                />
              </div>
              <div className='gridappsd-form-control'>
                <label className='gridappsd-form-control__label'>Line Name</label>
                <DropdownMenu
                  menuItems={lines.map(line => new MenuItem(line.name, line.mRID))}
                  onChange={menuItem => {
                    dispatch(new SetLineName(menuItem.value));
                    (document.querySelector('input.simulation-name') as HTMLInputElement).value = menuItem.label;
                    dispatch(new SetSimulationName(menuItem.label));
                    const repeater = setInterval(() => {
                      if (this._messageService.isActive()) {
                        // Ask the platform to send the model dict to our topic
                        this._messageService.fetchModelDictionary(menuItem.value);
                        clearInterval(repeater);
                      }
                    }, 500);
                  }}
                  defaultItemIndex={
                    (lines.filter(line => line.mRID === activeSimulationConfig.power_system_config.Line_name)[0] || { index: 0 }).index
                  }
                />
              </div>
            </div>
          </div>
          <div className='simulation-config-form__group'>
            <header className='simulation-config-form__group__heading'>Simulation Configuration</header>
            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Start time</label>
              <span className='gridappsd-form-control__ripple-input-field'>
                <input
                  type='text'
                  name='start_time'
                  className='start_time gridappsd-form-control__ripple-input-field__input'
                  defaultValue={activeSimulationConfig.simulation_config.start_time}
                  onBlur={event => {
                    dispatch(new SetStartTime((event.target as HTMLInputElement).value));
                  }} />
                <span className='gridappsd-form-control__ripple-input-field__ripple-bar'></span>
              </span>
            </div>
            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Duration</label>
              <span className='gridappsd-form-control__ripple-input-field'>
                <input
                  type='number'
                  name='duration'
                  className='duration gridappsd-form-control__ripple-input-field__input'
                  defaultValue={activeSimulationConfig.simulation_config.duration}
                  onBlur={event => {
                    dispatch(new SetDuration((event.target as HTMLInputElement).value));
                  }} />
                <span className='gridappsd-form-control__ripple-input-field__ripple-bar'></span>
              </span>
            </div>
            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Simulator</label>
              <DropdownMenu
                menuItems={
                  SIMULATION_CONFIG_OPTIONS.simulation_config.simulators.map(e => new MenuItem(e, e))
                }
                onChange={menuItem => {
                  dispatch(new SetSimulator(menuItem.value));
                }}
                defaultItemIndex={SIMULATION_CONFIG_OPTIONS.simulation_config.simulators.indexOf(activeSimulationConfig.simulation_config.simulator)} />
              <span style={{ display: 'inline-flex', flexFlow: 'column nowrap', verticalAlign: 'top' }}>
                <span
                  style={{
                    display: 'inline-block',
                    margin: 'auto 5px',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}>
                  Power Flow Solver Method
                </span>
                <span style={{ display: 'inline-block', margin: 'auto 5px' }}>NR</span>
              </span>
            </div>
            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Realtime</label>
              <CheckBox
                label=''
                name='realtime'
                uncheckable={true}
                onChange={input => {
                  this.props.dispatch(new ToggleRealtime(input.checked))
                }}
                value='test'
                checked={activeSimulationConfig.simulation_config.realtime} />
              <i
                className='app-icon show-realtime-hint'
                tabIndex={-1}
                onClick={() => this.setState({ showRealtimeHint: true })}>
                <Tooltip show={this.state.showRealtimeHint} onDismiss={() => this.setState({ showRealtimeHint: false })}>
                  <div>Checked: Run in real time. Slower than simulation time</div>
                  <div>Unchecked: Run in simulation time. Faster than real time</div>
                </Tooltip>
              </i>
            </div>

            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Simulation Name</label>
              <span className='gridappsd-form-control__ripple-input-field'>
                <input
                  type='text'
                  name='simulation_name'
                  className='simulation-name gridappsd-form-control__ripple-input-field__input'
                  onBlur={event => {
                    dispatch(new SetSimulationName((event.target as HTMLInputElement).value));
                  }}
                  defaultValue={activeSimulationConfig.simulation_config.simulation_name} />
                <span className='gridappsd-form-control__ripple-input-field__ripple-bar'></span>
              </span>
            </div>

            <div className='gridappsd-form-control'>
              <label className='gridappsd-form-control__label'>Model Creation Configuration</label>
              <textarea
                className='gridappsd-form-control__multiline-input'
                name='load_scaling_factor'
                defaultValue={JSON.stringify(activeSimulationConfig.simulation_config.model_creation_config, null, 4)}></textarea>
            </div>

          </div>
          <div className='simulation-config-form__group'>
            <header className='simulation-config-form__group__heading'>Application Configuration</header>
            <div className='controls'>
              <div className='gridappsd-form-control'>
                <label className='gridappsd-form-control__label'>Application Name</label>
                <DropdownMenu
                  menuItems={[
                    // 0 is the index of this app inside SimulationConfig.application_config.applications array
                    // new MenuItem('VVO', { index: 0, name: 'vvo' }),
                    new MenuItem('Sample App', { index: 0, name: 'sample_app' })
                  ]}
                  onChange={menuItem => {
                    if (SIMULATION_CONFIG_OPTIONS.application_config.applications[menuItem.value.index].config_string !== '') {
                      const configStr = JSON.stringify(JSON.parse(SIMULATION_CONFIG_OPTIONS.application_config.applications[menuItem.value.index].config_string), null, 4);
                      this.setState({
                        selectedAppName: menuItem.value.name,
                        appConfigStr: configStr
                      });
                      dispatch(new UpdateApplicationConfiguration(menuItem.value.name, configStr));
                    }
                  }}
                  defaultItemIndex={SIMULATION_CONFIG_OPTIONS.application_config.applications.findIndex(value => value.name === activeSimulationConfig.application_config.applications[0].name)}
                />
              </div>
              <div className='gridappsd-form-control' style={{ display: 'flex' }}>
                <label className='gridappsd-form-control__label'>Application Configuration</label>
                <div
                  className='gridappsd-form-control__multiline-input'
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={event => {
                    const newValue = (event.target as HTMLDivElement).textContent;
                    try {
                      // Check if the text entered is a valid JSON string
                      //const newConfigJson = JSON.parse(newValue);
                      dispatch(new UpdateApplicationConfiguration(this.state.selectedAppName, newValue));
                    }
                    catch (e) {
                      console.log(e);
                    }
                  }}>
                  {
                    this.state.appConfigStr
                  }
                </div>
              </div>
            </div>
          </div>
          <div className='simulation-config-form__options'>
            <Link
              to='/topology'
              className='simulation-config-form__options__done fab'
              onClick={() => {
                this.props.onSubmit(this.props.activeSimulationConfig)
                console.log(this.props.activeSimulationConfig);
              }} />
          </div>
        </form>
      );
    }
    return null;
  }

  private _fetchDataToPopulateForm() {
    if (sessionStorage.getItem('regions')) {
      const regions = JSON.parse(sessionStorage.getItem('regions'));
      const subregions = JSON.parse(sessionStorage.getItem('subregions'));
      const lines = JSON.parse(sessionStorage.getItem('lines'));
      this.setState({ regions, subregions, lines });
      this.props.dispatch(new StoreMRIDs(lines.map((line, index) => ({ displayName: line.name, value: line.mRID, index }))));
    }
    else {
      const repeater = setInterval(() => {
        if (this._messageService.isActive()) {
          const sub: StompSubscription = this._messageService.onFeederModelsReceived((payload: GetAllFeederModelsRequestPayload) => {
            const regions = [];
            const subregions = [];
            const lines = [];
            let index = 0;
            if (typeof payload.data === 'string')
              payload.data = JSON.parse(payload.data);
            for (const binding of payload.data.results.bindings) {
              addIfNotExists(regions, { regionName: binding.regionName.value, regionID: binding.regionID.value, index }, 'regionName');
              addIfNotExists(subregions, { subregionName: binding.subregionName.value, subregionID: binding.subregionID.value, index }, 'subregionName');
              addIfNotExists(lines, { name: binding.name.value, mRID: binding.mRID.value, index }, 'name');
              index++;
            }
            this.setState({ regions, subregions, lines });
            sub.unsubscribe();
            sessionStorage.setItem('regions', JSON.stringify(regions));
            sessionStorage.setItem('subregions', JSON.stringify(subregions));
            sessionStorage.setItem('lines', JSON.stringify(lines));
            this.props.dispatch(new StoreMRIDs(lines.map((line, index) => ({ displayName: line.name, value: line.mRID, index }))));
          });
          this._messageService.fetchAllFeederModels();
          clearInterval(repeater);
        }
      }, 500);
    }
  }
});

function addIfNotExists(array: any[], object: any, key: string) {
  if (array.every(e => e[key] !== object[key]))
    array.push(object);
}