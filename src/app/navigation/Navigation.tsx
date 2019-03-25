import * as React from 'react';
import { Link } from 'react-router-dom';
import { Subscription } from 'rxjs';

import { AppBar } from './app-bar/AppBar';
import { Drawer } from './drawer/Drawer';
import { DrawerOpener } from './drawer/DrawerOpener';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './drawer/DrawerItem';
import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { RUN_CONFIG } from '../../../runConfig';
import { SimulationConfiguration, Simulation, SimulationQueue } from '@shared/simulation';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { IconButton } from '@shared/buttons';


import './Navigation.scss';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfiguration) => void;
}

interface State {
  previousSimulations: Simulation[];
  websocketStatus: StompClientConnectionStatus;
}

export class Navigation extends React.Component<Props, State> {

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private _drawer: Drawer;
  private _queueChangesStream: Subscription;
  private _websocketStatusStream: Subscription;
  private static readonly _DEFAULT_SIMULATION_CONFIG: SimulationConfiguration = {
    power_system_config: {
      GeographicalRegion_name: 'ieee8500nodecktassets_Region',
      SubGeographicalRegion_name: 'ieee8500nodecktassets_SubRegion',
      Line_name: ''
    },
    simulation_config: {
      start_time: '2009-07-21 00:00:00',
      duration: '120',
      simulator: 'GridLAB-D',
      timestep_frequency: '1000',
      timestep_increment: '1000',
      run_realtime: true,
      simulation_name: 'ieee8500',
      power_flow_solver_method: 'NR',
      model_creation_config: {
        load_scaling_factor: '1',
        schedule_name: 'ieeezipload',
        z_fraction: '0',
        i_fraction: '1',
        p_fraction: '0',
        randomize_zipload_fractions: false,
        use_houses: false
      }
    },
    application_config: {
      applications: [
        // {
        //   'name': 'sample_app',
        //   'config_string': ''
        // }
        // {
        //   name: "vvo", config_string: "{\"static_inputs\": {\"ieee8500\" : {\"control_method\": \"ACTIVE\", \"capacitor_delay\": 60, \"regulator_delay\": 60, \"desired_pf\": 0.99, \"d_max\": 0.9, \"d_min\": 0.1,\"substation_link\": \"xf_hvmv_sub\",\"regulator_list\": [\"reg_FEEDER_REG\", \"reg_VREG2\", \"reg_VREG3\", \"reg_VREG4\"],\"regulator_configuration_list\": [\"rcon_FEEDER_REG\", \"rcon_VREG2\", \"rcon_VREG3\", \"rcon_VREG4\"],\"capacitor_list\": [\"cap_capbank0a\",\"cap_capbank0b\", \"cap_capbank0c\", \"cap_capbank1a\", \"cap_capbank1b\", \"cap_capbank1c\", \"cap_capbank2a\", \"cap_capbank2b\", \"cap_capbank2c\", \"cap_capbank3\"], \"voltage_measurements\": [\"l2955047,1\", \"l3160107,1\", \"l2673313,2\", \"l2876814,2\", \"m1047574,3\", \"l3254238,4\"],       \"maximum_voltages\": 7500, \"minimum_voltages\": 6500,\"max_vdrop\": 5200,\"high_load_deadband\": 100,\"desired_voltages\": 7000,   \"low_load_deadband\": 100,\"pf_phase\": \"ABC\"}}}"
        // }
      ]

    }
  };

  constructor(props: any) {
    super(props);
    this.state = {
      previousSimulations: this._simulationQueue.getAllSimulations(),
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'CONNECTING'
    };
    this._queueChangesStream = this._subscribeToAllSimulationsQueueSteam();
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .subscribe(state => this.setState({ websocketStatus: state }));
  }


  componentWillUnmount() {
    if (this._queueChangesStream)
      this._queueChangesStream.unsubscribe();
    if (this._websocketStatusStream)
      this._websocketStatusStream.unsubscribe();
  }

  render() {
    return (
      <>
        <AppBar>
          <DrawerOpener onClick={() => this._drawer.open()} />
          <Link className='navigation__app-title' to='/'>GridAPPS-D</Link>
          <span>{RUN_CONFIG.version}</span>
          {
            this.state.websocketStatus === 'CONNECTED'
            &&
            <IconButton
              icon='websocket-connection-active'
              className='websocket-status-indicator'
              label='Connection active' />
          }
        </AppBar>
        <Drawer ref={ref => this._drawer = ref}>
          <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(Navigation._DEFAULT_SIMULATION_CONFIG)}>
            <DrawerItemIcon icon='form' />
            <DrawerItemLabel value='Simulations' />
          </DrawerItem>
          {
            this.state.previousSimulations.length > 0 &&
            <DrawerItemGroup header='Previous simulations'>
              {
                this.state.previousSimulations.map(simulation => (
                  <DrawerItem key={simulation.id} onClick={() => this.props.onShowSimulationConfigForm(simulation.config)}>
                    <strong>Name:&nbsp;</strong>
                    {simulation.name}
                    &nbsp;&mdash;&nbsp;
                    <strong>ID:&nbsp;</strong>
                    {simulation.id}
                  </DrawerItem>
                ))
              }
            </DrawerItemGroup>
          }
          <DrawerItem>
            <Link to='/applications'>
              <DrawerItemIcon icon='app' />
              <DrawerItemLabel value='Applications & Services' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/browse'>
              <DrawerItemIcon icon='browse' />
              <DrawerItemLabel value='Browse Data' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/stomp-client'>
              <DrawerItemIcon icon='terminal' />
              <DrawerItemLabel value='Stomp Client' />
            </Link>
          </DrawerItem>
        </Drawer>
      </>
    );
  }

  private _subscribeToAllSimulationsQueueSteam(): Subscription {
    return this._simulationQueue.queueChanges()
      .subscribe(simulations => this.setState({ previousSimulations: simulations }));
  }
}