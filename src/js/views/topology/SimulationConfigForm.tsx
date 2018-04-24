import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Modal, Button, ModalTitle } from 'react-bootstrap';
import { StompSubscription } from '@stomp/stompjs';

import { DropdownMenu } from '../dropdown-menu/DropdownMenu';
import { MenuItem } from '../dropdown-menu/MenuItem';
import {
  SetGeographicalRegionName, SetSubGeographicalRegionName, SetLineName, SetSimulator,
  SetTimestepFrequency, SetTimestepIncrement, SetSimulationName, UpdateApplicationConfiguration,
  SetOutputObjects, StoreMRIDs
} from './simulation-config-form-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { AppState } from '../../models/AppState';
import { SIMULATION_CONFIG_OPTIONS } from '../../models/simulation-config-options';
import { MessageService } from '../../services/MessageService';
import { GetAllFeederModelsRequestPayload } from '../../models/message-requests/GetAllFeederModelsRequest';

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
  showSimulationOutput: boolean;
  regions: Array<{ regionName: string; regionID: string; index: number }>;
  subregions: Array<{ subregionName: string; subregionID: string; index: number }>;
  lines: Array<{ name: string; mRID: string; index: number }>;
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
      showSimulationOutput: false,
      appConfigStr: props.activeSimulationConfig.application_config.applications[0].config_string,
      regions: [],
      subregions: [],
      lines: []
    }
    this._hideSimulationOutputEditor = this._hideSimulationOutputEditor.bind(this);
    this._showSimulationOutputEditor = this._showSimulationOutputEditor.bind(this);
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
          <div className='group power-system-config'>
            <header>Power System Configuration</header>
            <div className='controls'>
              <div className='control'>
                <label>Geographical Region Name</label>
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
              <div className='control'>
                <label>SubGeographical Region Name</label>
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
              <div className='control'>
                <label>Line Name</label>
                <DropdownMenu
                  menuItems={lines.map(line => new MenuItem(line.name, line.mRID))}
                  onChange={menuItem => {
                    dispatch(new SetLineName(menuItem.value));
                    const repeater = setInterval(() => {
                      if (this._messageService.isActive()) {
                        // Ask the platform to send the model dict to our topic
                        this._messageService.fetchCimDictionary(menuItem.value);
                        console.log('fetching cim')
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
          <div className='group simulation-config'>
            <header>Simulation Configuration</header>
            <div className='control'>
              <label>Duration</label>
              <span className='input-field ripple'>
                <input
                  type='number'
                  name='duration'
                  className='duration'
                  defaultValue={activeSimulationConfig.simulation_config.duration}
                  onBlur={event => {
                    dispatch(new SetGeographicalRegionName((event.target as HTMLInputElement).value));
                  }} />
                <span className='ripple-bar'></span>
              </span>
            </div>
            <div className='control'>
              <label>Simulator</label>
              <DropdownMenu
                menuItems={
                  SIMULATION_CONFIG_OPTIONS.simulation_config.simulators.map(e => new MenuItem(e, e))
                }
                onChange={menuItem => {
                  dispatch(new SetSimulator(menuItem.value));
                }}
                defaultItemIndex={SIMULATION_CONFIG_OPTIONS.simulation_config.simulators.indexOf(activeSimulationConfig.simulation_config.simulator)} />
              <span className='inline-container'>
                <span className='inline-label'>Power Flow Solver Method</span>
                <span className='inline-value'>NR</span>
              </span>
              <button type='button' onClick={this._showSimulationOutputEditor} className='positive show-simulation-output'>Data</button>
            </div>
            <div className='control'>
              <label>Timestep Frequency</label>
              <span className='input-field ripple'>
                <input
                  type='number'
                  name='timestep_frequency'
                  className='timestep-frequency'
                  onBlur={event => {
                    dispatch(new SetTimestepFrequency((event.target as HTMLInputElement).value));
                  }}
                  defaultValue='1000' />
                <span className='ripple-bar'></span>
              </span>
            </div>
            <div className='control'>
              <label>Timestep Increment</label>
              <span className='input-field ripple'>
                <input
                  type='number'
                  name='timestep_increment'
                  className='timestep-increment'
                  step='1000'
                  onBlur={event => {
                    dispatch(new SetTimestepIncrement((event.target as HTMLInputElement).value));
                  }}
                  defaultValue='1000' />
                <span className='ripple-bar'></span>
              </span>
            </div>
            <div className='control'>
              <label>Simulation Name</label>
              <span className='input-field ripple'>
                <input
                  type='text'
                  name='simulation_name'
                  className='simulation-name'
                  onBlur={event => {
                    dispatch(new SetSimulationName((event.target as HTMLInputElement).value));
                  }}
                  defaultValue={activeSimulationConfig.simulation_config.simulation_name} />
                <span className='ripple-bar'></span>
              </span>
            </div>

            <div className='control'>
              <label>Model Creation Configuration</label>
              <textarea
                name='load_scaling_factor'
                defaultValue={JSON.stringify(activeSimulationConfig.simulation_config.model_creation_config, null, 4)}></textarea>
            </div>

          </div>
          <div className='group application-config'>
            <header>Application Configuration</header>
            <div className='controls'>
              <div className='control'>
                <label>Application Name</label>
                <DropdownMenu
                  menuItems={[
                    // 0 is the index of this app inside SimulationConfig.application_config.applications array
                    new MenuItem('VVO', { index: 0, name: 'vvo' }),
                    new MenuItem('Sample App', { index: 1, name: 'sample_app' })
                  ]}
                  onChange={menuItem => {
                    const configStr = JSON.stringify(JSON.parse(SIMULATION_CONFIG_OPTIONS.application_config.applications[menuItem.value.index].config_string), null, 4);
                    this.setState({
                      selectedAppName: menuItem.value.name,
                      appConfigStr: configStr
                    });
                    dispatch(new UpdateApplicationConfiguration(menuItem.value.name, configStr));
                  }}
                  defaultItemIndex={SIMULATION_CONFIG_OPTIONS.application_config.applications.findIndex(value => value.name === activeSimulationConfig.application_config.applications[0].name)}
                />
              </div>
              <div className='control' style={{ display: 'flex' }}>
                <label>Application Configuration</label>
                <div
                  className='config-str-editor'
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
          <div className='options'>
            <Link
              to='/topology'
              className='done fab'
              onClick={() => this.props.onSubmit(this.props.activeSimulationConfig)} />
          </div>
          <Modal show={this.state.showSimulationOutput} onHide={this._hideSimulationOutputEditor}>
            <Modal.Header>
              <ModalTitle>Simulation Output Objects</ModalTitle>
            </Modal.Header>
            <Modal.Body>
              <div className='control'>
                <textarea
                  name='simulation_output'
                  onBlur={event => {
                    const newValue = (event.target as HTMLTextAreaElement).value;
                    dispatch(new SetOutputObjects(JSON.parse(newValue)));
                  }}
                  defaultValue={JSON.stringify(activeSimulationConfig.simulation_config.simulation_output.output_objects, null, 4)} />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this._hideSimulationOutputEditor}>Close</Button>
              <Button bsStyle="primary" onClick={this._hideSimulationOutputEditor}>Save</Button>
            </Modal.Footer>
          </Modal>
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
  private _hideSimulationOutputEditor() {
    this.setState({ showSimulationOutput: false });
  }

  private _showSimulationOutputEditor() {
    this.setState({ showSimulationOutput: true });
  }
});

function addIfNotExists(array: any[], object: any, key: string) {
  if (array.every(e => e[key] !== object[key]))
    array.push(object);
}