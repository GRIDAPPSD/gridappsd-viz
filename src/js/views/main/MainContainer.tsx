import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../../models/AppState';
import { Simulation } from '../../models/Simulation';
import { Main } from './Main';
import { SetActiveSimulationConfig, AddSimulation, SetNewFncsOutput } from './main-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { MessageService } from '../../services/MessageService';
import { SimulationControlService } from '../../services/SimulationControlService';
import { CimDictionary } from '../../models/cim-dictionary/CimDictionary';
import { RequestConfigurationType } from '../../models/message-requests/RequestConfigurationType';
import { FncsOutputMeasurement } from '../../models/fncs-output/FncsOutputMeasurement';
import { CimDictionaryMeasurement } from '../../models/cim-dictionary/CimDictionaryMeasurement';

interface Props {
  previousSimulations: Simulation[];
  dispatch: any;
}

interface State {
}

const mapStateToProps = (state: AppState): Props => ({
  previousSimulations: state.previousSimulations
} as Props);

const MESSAGE_SERVICE = MessageService.getInstance();
const SIMULATION_CONTROL_SERVICE = SimulationControlService.getInstance();
let fncsSubscription = null;
let cimDictionaryMeasurements: { [mRID: string]: CimDictionaryMeasurement } = null;

export const MainContainer = connect(mapStateToProps)(class extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    if (fncsSubscription) {
      fncsSubscription.unsubscribe();
      fncsSubscription = null;
    }
    this._setupTopicSubscribers();
  }

  render() {
    return (
      <Main
        previousSimulations={this.props.previousSimulations}
        onPreviousSimulationSelected={(simulation: Simulation) => this.props.dispatch(new SetActiveSimulationConfig(simulation.config))}
        onSimulationConfigFormSubmitted={(simulationConfig: SimulationConfig) => {
          this.props.dispatch(new AddSimulation({
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
        const cimDictionarySub = MESSAGE_SERVICE.onCimDictionaryReceived((payload: CimDictionary) => {
          if (payload.requestType === RequestConfigurationType.CIM_DICTIONARY) {
            cimDictionaryMeasurements = payload.data.feeders[0].measurements.reduce(
              (result, measurement) => {
                result[measurement.mRID] = measurement;
                return result;
              },
              {}
            );
            cimDictionarySub.unsubscribe();
          }
        });

        fncsSubscription = SIMULATION_CONTROL_SERVICE.onFncsOutputReceived(payload => {
          console.log('Fncs Output from MainContainer:', payload)
          if (cimDictionaryMeasurements)
            this.props.dispatch(new SetNewFncsOutput({
              simulationId: payload.output.simulation_id,
              command: payload.command,
              timestamp: payload.output.message.timestamp,
              measurements: payload.output.message.measurements.map(measurement => {
                const measurementInCimDictionary = cimDictionaryMeasurements[measurement.measurement_mrid];
                if (measurementInCimDictionary)
                  return {
                    magnitude: measurement.magnitude,
                    angle: measurement.angle,
                    value: measurement.value,
                    mRID: measurement.measurement_mrid,
                    phases: measurementInCimDictionary.phases,
                    conductingEquipmentName: measurementInCimDictionary.ConductingEquipment_name,
                    connectivityNode: measurementInCimDictionary.ConductingEquipment_type
                  } as FncsOutputMeasurement;
                return null;
              }).filter(e => e !== null)
            }));
        });
        clearInterval(repeater);
      }
    }, 500);
  }
});