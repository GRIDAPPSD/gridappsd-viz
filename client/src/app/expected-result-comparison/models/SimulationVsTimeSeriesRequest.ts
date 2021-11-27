/* eslint-disable camelcase */
import { MessageRequest } from '@client:common/MessageRequest';

export class SimulationVsTimeSeriesRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.simulation';

  readonly requestBody = {
    power_system_config: {
      SubGeographicalRegion_name: '_1CD7D2EE-3C91-3248-5662-A43EFEFAC224',
      GeographicalRegion_name: '_24809814-4EC6-29D2-B509-7F8BFB646437',
      Line_name: '_C1C3E687-6FFD-C753-582B-632A27E28507' // IEEE123
    },
    simulation_config: {
      power_flow_solver_method: 'NR',
      duration: 60,
      simulation_name: 'ieee123',
      simulator: 'GridLAB-D',
      start_time: 1248156000,
      run_realtime: true,
      simulation_output: {},
      model_creation_config: {
        load_scaling_factor: 1.0,
        triplex: 'y',
        encoding: 'u',
        system_frequency: 60,
        voltage_multiplier: 1.0,
        power_unit_conversion: 1.0,
        unique_names: 'y',
        schedule_name: 'ieeezipload',
        z_fraction: 0.0,
        i_fraction: 1.0,
        p_fraction: 0.0,
        randomize_zipload_fractions: false,
        use_houses: false
      },
      simulation_broker_port: 52798,
      simulation_broker_location: '127.0.0.1'
    },
    application_config: {
      applications: [
        {
          name: 'sample_app',
          config_string: ''
        }
      ]
    },
    simulation_request_type: 'NEW',
    test_config: {
      appId: 'sample_app',
      testId: Math.trunc(Math.random() * 1_000_000),
      compareWithSimId: -1,
      testType: 'simulation_vs_timeseries'
    }
  };

  readonly replyTo = '/expected-result-comparison/simulation-vs-time-series';

  constructor(simulationConfiguration: unknown | null, simulationId: number) {
    if (simulationConfiguration !== null) {
      Object.assign(this.requestBody, simulationConfiguration);
    }
    this.requestBody.test_config.compareWithSimId = simulationId;
  }

}
