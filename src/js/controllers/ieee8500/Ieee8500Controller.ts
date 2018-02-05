import Ieee8500MainModel from '../../models/ieee8500/Ieee8500MainModel';
import DataSource from '../../interfaces/DataSource';
import '../../libs/stomp.js';
import gossServerUrl from '../../../../runConfig';

declare var Stomp: any;

class Ieee8500Controller {

  private _ieee8500MainModel: Ieee8500MainModel = new Ieee8500MainModel();
  private _isPolling: boolean = false;
  private _pollInterval: number = 250;
  private _dataSource: DataSource;
  private _simulationMessage: any;

  private _stompClient: any;
  // private _websocketConnected: boolean = false;
  private _simulationControlTopic = '/queue/goss.gridappsd.process.request.simulation';
  private _responseQueueTopic = '/temp-queue/response-queue';
  private _simulationStatusTopic = '/topic/goss.gridappsd.simulation.status.';
  private _fncsOutputTopic = '/topic/goss.gridappsd.fncs.output';

  get model(): Ieee8500MainModel {
    return this._ieee8500MainModel;
  }

  get dataSource(): DataSource {
    return this._dataSource;
  }

  get simulationMessage() {
    return this._simulationMessage;
  }
  constructor(dataSource: DataSource) {

    this._dataSource = dataSource;

    if (dataSource == DataSource.RabinalWebsocket) {
      this.connectWebsocket();
    }
  }

  connectWebsocket() {

    // let self = this;

    //var gossServerUrl='ws://127.0.0.1:61614';
    //var gossServerUrl='ws://130.20.106.209:61614';
    this._stompClient = Stomp.client(gossServerUrl, null);
    this._stompClient.heartbeat.outgoing = 0;
    this._stompClient.heartbeat.incoming = 0;
    this._stompClient.connect(
      'system',
      'manager',
      this.onWebsocketConnected.bind(this),
      this.onWebsocketDisconnected.bind(this));
  }

  onWebsocketConnected() {
    console.log('Websocket connected ' + gossServerUrl);
    // this._websocketConnected = true;

    let self = this;
    this._stompClient.subscribe(this._responseQueueTopic,
      (responseQueueMessage: any) => {
        let simulationId = JSON.parse(responseQueueMessage.body);
        console.log('Received simulation id: ' + simulationId);
        self._stompClient.subscribe(self._simulationStatusTopic + simulationId, self.onSimulationStatusReceived.bind(self));
      }
    );
    this._stompClient.subscribe(this._fncsOutputTopic, this.onFncsOutputReceived.bind(this));
  }

  onWebsocketDisconnected() {
    console.log('Websocket disconnected');
    // this._websocketConnected = false;
  }

  sendControlMessage() {

    this._stompClient.send(this._simulationControlTopic,
      { "reply-to": "/temp-queue/response-queue" },
      JSON.stringify(this._simulationRequest));
  }

  onSimulationStatusReceived(message: any) {

    console.log('Simulation status: ');
    console.log(message.body);
    if (this._simulationMessage == undefined) {
      this._simulationMessage = message.body;
    }
    else
      this._simulationMessage = this._simulationMessage + "\n" + message.body;

    console.log(this._simulationMessage);

    this._ieee8500MainModel.messageModel.set('msg', { data: this._simulationMessage });
  }

  onFncsOutputReceived(message: any) {

    console.log('Fncs output: ');

    let data = JSON.parse(message.body);
    console.log(data);
    if (data.output != null) {
      data.output = JSON.parse(data.output);
    }
    data.timestamp = new Date(Date.now());
    this._ieee8500MainModel.timeseriesModel.set('curTime', { data: data });
  }

  startSimulation() {
    this.sendControlMessage();
  }

  /**
   * Starts polling for timeseries data.
   */
  startPolling() {

    this._isPolling = true;
    this.poll();
  }

  poll() {

    if (this._isPolling) {

      this._ieee8500MainModel.timeseriesModel.fetch();
      let self = this;
      setTimeout(
        self.poll.bind(this),
        self._pollInterval
      )
    }
  }

  stopPolling() {
    this._isPolling = false;
  }

  setSimulationRequest(value: any) {
    this._simulationRequest = value;
  }
  private _simulationRequest = {
    "power_system_config": {
      "GeographicalRegion_name": "ieee8500nodecktassets_Region",
      "SubGeographicalRegion_name": "ieee8500nodecktassets_SubRegion",
      "Line_name": "ieee8500"
    },
    "simulation_config": {
      "start_time": "2009-07-21 00:00:00",
      "duration": "120",
      "simulator": "GridLAB-D",
      "timestep_frequency": "1000",
      "timestep_increment": "1000",
      "simulation_name": "ieee8500",
      "power_flow_solver_method": "NR",
      "simulation_output": {
        "output_objects": [{
          "name": "rcon_FEEDER_REG",
          "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
        }, {
          "name": "rcon_VREG2",
          "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
        }, {
          "name": "rcon_VREG3",
          "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
        }, {
          "name": "rcon_VREG4",
          "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
        }, {
          "name": "reg_FEEDER_REG",
          "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
        }, {
          "name": "reg_VREG2",
          "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
        }, {
          "name": "reg_VREG3",
          "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
        }, {
          "name": "reg_VREG4",
          "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
        }, {
          "name": "cap_capbank0a",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
        }, {
          "name": "cap_capbank1a",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
        }, {
          "name": "cap_capbank2a",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
        }, {
          "name": "cap_capbank0b",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
        }, {
          "name": "cap_capbank1b",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
        }, {
          "name": "cap_capbank2b",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
        }, {
          "name": "cap_capbank0c",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
        }, {
          "name": "cap_capbank1c",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
        }, {
          "name": "cap_capbank2c",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
        }, {
          "name": "cap_capbank3",
          "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "capacitor_B", "capacitor_C", "dwell_time", "switchA", "switchB", "switchC"]
        }, {
          "name": "xf_hvmv_sub",
          "properties": ["power_in_A", "power_in_B", "power_in_C"]
        }, {
          "name": "nd_l2955047",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_l2673313",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_l3160107",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_l2876814",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_l3254238",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_m1047574",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd__hvmv_sub_lsb",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_190-8593",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_190-8581",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }, {
          "name": "nd_190-7361",
          "properties": ["voltage_A", "voltage_B", "voltage_C"]
        }]
      },
      "model_creation_config": {
        "load_scaling_factor": "1",
        "schedule_name": "ieeezipload",
        "z_fraction": "0",
        "i_fraction": "1",
        "p_fraction": "0"
      }
    },
    "application_config": {
      "applications": [
        {
          "name": "vvo", "config_string": "{\"static_inputs\": {\"ieee8500\" : {\"control_method\": \"ACTIVE\", \"capacitor_delay\": 60, \"regulator_delay\": 60, \"desired_pf\": 0.99, \"d_max\": 0.9, \"d_min\": 0.1,\"substation_link\": \"xf_hvmv_sub\",\"regulator_list\": [\"reg_FEEDER_REG\", \"reg_VREG2\", \"reg_VREG3\", \"reg_VREG4\"],\"regulator_configuration_list\": [\"rcon_FEEDER_REG\", \"rcon_VREG2\", \"rcon_VREG3\", \"rcon_VREG4\"],\"capacitor_list\": [\"cap_capbank0a\",\"cap_capbank0b\", \"cap_capbank0c\", \"cap_capbank1a\", \"cap_capbank1b\", \"cap_capbank1c\", \"cap_capbank2a\", \"cap_capbank2b\", \"cap_capbank2c\", \"cap_capbank3\"], \"voltage_measurements\": [\"nd_l2955047,1\", \"nd_l3160107,1\", \"nd_l2673313,2\", \"nd_l2876814,2\", \"nd_m1047574,3\", \"nd_l3254238,4\"],       \"maximum_voltages\": 7500, \"minimum_voltages\": 6500,\"max_vdrop\": 5200,\"high_load_deadband\": 100,\"desired_voltages\": 7000,   \"low_load_deadband\": 100,\"pf_phase\": \"ABC\"}}}"
        }
      ]

    }
  }

}

export default Ieee8500Controller;
