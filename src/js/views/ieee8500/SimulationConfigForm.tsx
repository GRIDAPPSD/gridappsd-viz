import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Modal, Button, ModalTitle } from 'react-bootstrap';

import { DropdownMenu } from '../dropdown-menu/DropdownMenu';
import { MenuItem } from '../dropdown-menu/MenuItem';
import {
  SetGeographicalRegionName, SetSubGeographicalRegionName, SetLineName, SetSimulator,
  SetTimestepFrequency, SetTimestepIncrement, SetSimulationName, UpdateApplicationConfiguration,
  SetOutputObjects
} from '../../actions/simulation-config-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { AppState } from '../../models/AppState';
// import { DEFAULT_REQUEST_CONFIG } from '../../reducers/activeSimulationConfig';
import './SimulationConfigForm.styles.scss';
import { SIMULATION_CONFIG_OPTIONS } from '../../models/simulation-config-options';

interface Props {
  show: boolean;
  onSubmit: (SimulationConfig: SimulationConfig) => void;
  dispatch: any;
  activeSimulationConfig: SimulationConfig;
}

interface State {
  selectedAppName: string;
  appConfigStr: string;
  showSimulationOutput: boolean;
}
class SimulationConfigFormContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      selectedAppName: '',
      showSimulationOutput: false,
      appConfigStr: props.activeSimulationConfig.application_config.applications[0].config_string
    }
    this._hideSimulationOutputEditor = this._hideSimulationOutputEditor.bind(this);
    this._showSimulationOutputEditor = this._showSimulationOutputEditor.bind(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props !== newProps)
      this.setState({
        appConfigStr: newProps.activeSimulationConfig.application_config.applications[0].config_string
      });
  }
  render() {
    if (this.props.show) {
      const { dispatch, activeSimulationConfig } = this.props;
      return (
        <form className='simulation-config-form'>
          <div className='group power-system-config'>
            <header>Power System Configuration</header>
            <div className='controls'>
              <div className='control'>
                <label>Geographical Region Name</label>
                <DropdownMenu
                  menuItems={
                    _mapStringArrayToMenuItems(SIMULATION_CONFIG_OPTIONS.power_system_config.GeographicalRegion_names)
                  }
                  onChange={menuItem => {
                    dispatch(new SetGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={SIMULATION_CONFIG_OPTIONS.power_system_config.GeographicalRegion_names.indexOf(activeSimulationConfig.power_system_config.GeographicalRegion_name)}
                />
              </div>
              <div className='control'>
                <label>SubGeographical Region Name</label>
                <DropdownMenu
                  menuItems={
                    _mapStringArrayToMenuItems(SIMULATION_CONFIG_OPTIONS.power_system_config.SubGeographicalRegion_names)                    
                  }
                  onChange={menuItem => {
                    dispatch(new SetSubGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={SIMULATION_CONFIG_OPTIONS.power_system_config.SubGeographicalRegion_names.indexOf(activeSimulationConfig.power_system_config.SubGeographicalRegion_name)}
                />
              </div>
              <div className='control'>
                <label>Line Name</label>
                <DropdownMenu
                  menuItems={
                    _mapStringArrayToMenuItems(SIMULATION_CONFIG_OPTIONS.power_system_config.Line_names)
                  }
                  onChange={menuItem => {
                    dispatch(new SetLineName(menuItem.value));
                  }}
                  defaultItemIndex={SIMULATION_CONFIG_OPTIONS.power_system_config.Line_names.indexOf(activeSimulationConfig.power_system_config.Line_name)}
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
                  _mapStringArrayToMenuItems(SIMULATION_CONFIG_OPTIONS.simulation_config.simulators)
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
                  defaultValue='ieee8500' />
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
                    new MenuItem('VVO', 'vvo', { index: 0, name: 'vvo' }),
                    new MenuItem('Sample App', 'sample_app', { index: 1, name: 'sample_app' })
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
              to='/ieee8500'
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

  private _hideSimulationOutputEditor() {
    this.setState({ showSimulationOutput: false });
  }

  private _showSimulationOutputEditor() {
    this.setState({ showSimulationOutput: true });
  }
}

const mapStateToProps = (state: AppState): Props => {
  return {
    activeSimulationConfig: state.activeSimulationConfig
  } as Props;
}
export const SimulationConfigForm = connect(mapStateToProps)(SimulationConfigFormContainer);

function _mapStringArrayToMenuItems(array: string[]): MenuItem[] {
  return array.map(e => new MenuItem(e, e, e));
}