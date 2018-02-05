import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import './RequestConfigForm.styles.scss';
import { DropdownMenu } from '../dropdown-menu/DropdownMenu';
import { MenuItem } from '../dropdown-menu/MenuItem';
import { SetGeographicalRegionName, SetSubGeographicalRegionName, SetLineName, SetSimulator, SetTimestepFrequency, SetTimestepIncrement, SetSimulationName, SetPowerFlowSolverMethod, SetApplicationConfiguration } from './actions';
import { DEFAULT_REQUEST_CONFIG as requestConfig } from './reducers';
import { RequestConfig } from '../../models/RequestConfig';
import { AppState } from '../../models/AppState';

interface Props {
  show: boolean;
  onSubmit: (requestConfig: RequestConfig) => void;
  dispatch: any;
  requestConfig: RequestConfig;
}

interface State {
  selectedApp: string;
}
class RequestConfigFormContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      selectedApp: 'vvo'
    }
  }
  render() {
    if (this.props.show) {
      const { dispatch } = this.props;
      return (
        <form className='request-config-form'>
          <div className='group power-system-config'>
            <header>Power System Configuration</header>
            <div className='controls'>
              <div className='control'>
                <label>Geographical Region Name</label>
                <DropdownMenu
                  menuItems={[new MenuItem('ieee8500nodecktassets_Region', 'ieee8500nodecktassets_Region', 'ieee8500nodecktassets_Region')]}
                  onChange={menuItem => {
                    dispatch(new SetGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={0}
                />
              </div>
              <div className='control'>
                <label>SubGeographical Region Name</label>
                <DropdownMenu
                  menuItems={[new MenuItem('ieee8500nodecktassets_SubRegion', 'ieee8500nodecktassets_SubRegion', 'ieee8500nodecktassets_SubRegion')]}
                  onChange={menuItem => {
                    dispatch(new SetSubGeographicalRegionName(menuItem.value));
                  }}
                  defaultItemIndex={0}
                />
              </div>
              <div className='control'>
                <label>Line Name</label>
                <DropdownMenu
                  menuItems={[new MenuItem('ieee8500', 'ieee8500', 'ieee8500')]}
                  onChange={menuItem => {
                    dispatch(new SetLineName(menuItem.value));
                  }}
                  defaultItemIndex={0}
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
                  defaultValue='120'
                  onBlur={event => {
                    dispatch(new SetGeographicalRegionName((event.target as HTMLInputElement).value));
                  }} />
                <span className='ripple-bar'></span>
              </span>
            </div>
            <div className='control'>
              <label>Simulator</label>
              <DropdownMenu
                menuItems={[new MenuItem('GridLAB-D', 'GridLAB-D', 'GridLAB-D')]}
                onChange={menuItem => {
                  dispatch(new SetSimulator(menuItem.value));
                }}
                defaultItemIndex={0} />

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
              <label>Power Flow Solver Method</label>
              <DropdownMenu
                menuItems={[
                  new MenuItem('NR', 'NR', 'NR'),
                  new MenuItem('FBS', 'FBS', 'FBS')
                ]}
                defaultItemIndex={0}
                onChange={menuItem => {
                  dispatch(new SetPowerFlowSolverMethod(menuItem.value));
                }}
              />
            </div>
            <div className='control'>
              <label>Simulation Output Objects</label>
              <textarea
                name='simulation_output'
                defaultValue={requestConfig.simulation_config.simulation_output.output_objects[0].properties} />
            </div>
            <div className='control'>
              <label>Model Creation Configuration</label>
              <textarea
                name='load_scaling_factor'
                defaultValue={JSON.stringify(requestConfig.simulation_config.model_creation_config.load_scaling_factor, null, 4)}></textarea>
            </div>

          </div>
          <div className='group application-config'>
            <header>Application Configuration</header>
            <div className='controls'>
              <div className='control'>
                <label>Application Name</label>
                <DropdownMenu
                  menuItems={[
                    new MenuItem('VVO', 'vvo', 'vvo'),
                    new MenuItem('Sample App', 'sample', 'sample')
                  ]}
                  onChange={menuItem => {
                    this.setState({ selectedApp: menuItem.value });
                  }}
                  defaultItemIndex={0}
                />
              </div>
              <div className='control'>
                <label>Application Configuration</label>
                <textarea
                  name='vvo'
                  onChange={event => {
                    const newVal = (event.target as HTMLTextAreaElement).value;
                    dispatch(new SetApplicationConfiguration(this.state.selectedApp, newVal));
                  }}
                  defaultValue={JSON.stringify(JSON.parse(requestConfig.application_config.applications[0].config_string), null, 4)}></textarea>
              </div>
            </div>
          </div>
          <Link
            to='/ieee8500'
            className='done app-icon'
            onClick={() => this.props.onSubmit(this.props.requestConfig)}></Link>
        </form>
      );
    }
    return null;
  }
}

const mapStateToProps = (state: AppState): Props => {
  return {
    requestConfig: state.requestConfig
  } as Props;
}
export const RequestConfigForm = connect(mapStateToProps)(RequestConfigFormContainer);