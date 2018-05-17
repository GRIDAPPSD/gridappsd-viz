import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../../models/AppState';
import { Simulation } from '../../models/Simulation';
import { Main } from './Main';
import { SetActiveSimulationConfig, ReplaceSimulation, SetNewSimulationOutput } from './main-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { MessageService } from '../../services/MessageService';
import { SimulationControlService } from '../../services/SimulationControlService';
import { ModelDictionary } from '../../models/model-dictionary/ModelDictionary';
import { RequestConfigurationType } from '../../models/message-requests/RequestConfigurationType';
import { SimulationOutputMeasurement } from '../../models/simulation-output/SimulationOutputMeasurement';
import { ModelDictionaryMeasurement } from '../../models/model-dictionary/ModelDictionaryMeasurement';

interface Props {
  previousSimulations: Simulation[];
  dispatch: any;
  currentSimulationName: string;
}

interface State {
}

const mapStateToProps = (state: AppState): Props => ({
  previousSimulations: state.previousSimulations,
  currentSimulationName: state.activeSimulationConfig.simulation_config.simulation_name
} as Props);

const MESSAGE_SERVICE = MessageService.getInstance();
const SIMULATION_CONTROL_SERVICE = SimulationControlService.getInstance();
let simulationOutputSubscription = null;
const MODEL_DIRECTIONARY_MEASUREMENTS_PER_SIMULATION_NAME: { [name: string]: { [mRID: string]: ModelDictionaryMeasurement } } = {};

export const MainContainer = connect(mapStateToProps)(class extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    if (simulationOutputSubscription) {
      simulationOutputSubscription.unsubscribe();
      simulationOutputSubscription = null;
    }
    this._setupTopicSubscribers();
  }

  render() {
    return (
      <Main
        previousSimulations={this.props.previousSimulations}
        onPreviousSimulationSelected={(simulation: Simulation) => this.props.dispatch(new SetActiveSimulationConfig(simulation.config))}
        onSimulationConfigFormSubmitted={(simulationConfig: SimulationConfig) => {
          console.log(simulationConfig);
          this.props.dispatch(new ReplaceSimulation({
            name: simulationConfig.simulation_config.simulation_name,
            config: simulationConfig,
            id: simulationConfig.simulation_config.simulation_name
          }));
          this.props.dispatch(new SetActiveSimulationConfig(simulationConfig));
          // Wait until TopologyModelRendererContainer component is mounted before requesting the data
          setTimeout(() => MESSAGE_SERVICE.fetchTopologyModel(simulationConfig.power_system_config.Line_name), 1000);
        }}
      />
    );
  }

  private _setupTopicSubscribers() {
    const repeater = setInterval(() => {
      if (MESSAGE_SERVICE.isActive()) {
        MESSAGE_SERVICE.onModelDictionaryReceived((payload: ModelDictionary) => {
          if (payload.requestType === RequestConfigurationType.CIM_DICTIONARY) {
            const modelDictionaryMeasurements = payload.data.feeders[0].measurements.reduce(
              (result, measurement) => {
                result[measurement.mRID] = measurement;
                return result;
              },
              {}
            );
            MODEL_DIRECTIONARY_MEASUREMENTS_PER_SIMULATION_NAME[this.props.currentSimulationName] = modelDictionaryMeasurements;
          }
        });

        simulationOutputSubscription = SIMULATION_CONTROL_SERVICE.onSimulationOutputReceived(payload => {
          const modelDictionaryMeasurements = MODEL_DIRECTIONARY_MEASUREMENTS_PER_SIMULATION_NAME[this.props.currentSimulationName];
          if (modelDictionaryMeasurements && payload.output && Object.keys(payload.output).length !== 0)
            this.props.dispatch(new SetNewSimulationOutput({
              simulationId: payload.output.simulation_id,
              command: payload.command,
              timestamp: payload.output.message.timestamp,
              measurements: payload.output.message.measurements.map(measurement => {
                const measurementInModelDictionary = modelDictionaryMeasurements[measurement.measurement_mrid];
                if (measurementInModelDictionary)
                  return {
                    name: measurementInModelDictionary.name,
                    type: measurementInModelDictionary.measurementType,
                    magnitude: measurement.magnitude,
                    angle: measurement.angle,
                    value: measurement.value,
                    mRID: measurement.measurement_mrid,
                    phases: measurementInModelDictionary.phases,
                    conductingEquipmentName: measurementInModelDictionary.ConductingEquipment_name,
                    connectivityNode: measurementInModelDictionary.ConnectivityNode
                  } as SimulationOutputMeasurement;
                return null;
              }).filter(e => e !== null)
            }));
        });
        clearInterval(repeater);
      }
    }, 500);
  }
});