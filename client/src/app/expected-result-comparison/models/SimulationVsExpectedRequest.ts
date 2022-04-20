/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { MessageRequest } from '@client:common/MessageRequest';

export class SimulationVsExpectedRequest implements MessageRequest {

  readonly requestBody = {
    power_system_config: {
      SubGeographicalRegion_name: '_1CD7D2EE-3C91-3248-5662-A43EFEFAC224',
      GeographicalRegion_name: '_24809814-4EC6-29D2-B509-7F8BFB646437',
      Line_name: '_C1C3E687-6FFD-C753-582B-632A27E28507'
    },
    simulation_config: {
      power_flow_solver_method: 'NR',
      duration: 60,
      simulation_name: 'ieee123',
      simulator: 'GridLAB-D',
      start_time: 1649865569,
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
      testId: null as number,
      testType: 'simulation_vs_expected',
      expectedResults: {},
      events: null as any,
      testInput: true,
      testOutput: true,
      matchInputTimes: true,
      storeMatches: false
    }
  };

  readonly url: string;
  readonly replyTo: string;

  // * Ignore events for now, needs to bring it back once hear back from Poorva.
  // constructor(simulationConfiguration: unknown | null, expectedResults: unknown, events: unknown[]) {
  constructor(simulationConfiguration: unknown | null, expectedResults: unknown) {
    if (simulationConfiguration !== null) {
      Object.assign(this.requestBody.simulation_config, simulationConfiguration['simulation_config']);
      Object.assign(this.requestBody.power_system_config, simulationConfiguration['power_system_config']);
      Object.assign(this.requestBody.application_config, simulationConfiguration['application_config']);
      this.requestBody.simulation_request_type = simulationConfiguration['simulation_request_type'];
    }
    if (expectedResults !== null) {
      this.requestBody.test_config.expectedResults = expectedResults;
    }
    const testId = Math.trunc(Math.random() * 1_000_000);
    this.url = 'goss.gridappsd.process.request.simulation';
    this.replyTo = `/topic/goss.gridappsd.simulation.test.output.${testId}`;
    this.requestBody.test_config.testId = testId;
    // this.requestBody.test_config.events = events;
  }
}
