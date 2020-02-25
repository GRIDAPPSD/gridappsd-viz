import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { SimulationQueue, SimulationControlService, SimulationOutputMeasurement } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { MeasurementValueTable } from './MeasurementValueTable';

interface Props {
}

interface State {
  measurementValueTables: Array<{
    nodeNameToAttachTo: string;
    measurements: {
      taps: SimulationOutputMeasurement[];
      voltages: SimulationOutputMeasurement[];
      powers: SimulationOutputMeasurement[];
    };
  }>;
}

const NODES_PER_TOPOLOGY = {
  ieee8500: {
    capbank0: ['A', 'B', 'C'],
    capbank1: ['A', 'B', 'C'],
    capbank2: ['A', 'B', 'C'],
    capbank3: ['A', 'B', 'C'],
    VREG2: ['A', 'B', 'C'],
    VREG3: ['A', 'B', 'C'],
    VREG4: ['A', 'B', 'C'],
    FEEDER_REG: ['A', 'B', 'C']
  },
  ieee123: {
    c83: ['A', 'B', 'C'],
    reg2: ['A', 'B', 'C'],
    reg3: ['A', 'B', 'C'],
    reg4: ['A', 'B', 'C']
  },
  ieee123pv: {
    c83: ['A', 'B', 'C'],
    reg2: ['A', 'B', 'C'],
    reg3: ['A', 'B', 'C'],
    reg4: ['A', 'B', 'C']
  },
  ieee8500new_335: {
    feeder_reg1: ['A', 'B', 'C'],
    feeder_reg2: ['A', 'B', 'C'],
    feeder_reg3: ['A', 'B', 'C']
  }
};

export class MeasurementValueTableContainer extends React.Component<Props, State> {

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      measurementValueTables: []
    };

  }

  componentDidMount() {
    this._subscribeToSimulationOutputMeasurementsStream();
    this._resetLabelsWhenSimulationStarts();
  }

  private _resetLabelsWhenSimulationStarts() {
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTED && this._simulationControlService.isUserInActiveSimulation())
      )
      .subscribe({
        next: () => {
          this.setState({
            measurementValueTables: []
          });
        }
      });
  }
  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      this.state.measurementValueTables.map((e, i) => (
        <MeasurementValueTable
          key={i}
          nodeNameToAttachTo={e.nodeNameToAttachTo}
          measurements={e.measurements} />
      ))
    );
  }

  private _subscribeToSimulationOutputMeasurementsStream() {
    this._simulationControlService.simulationOutputMeasurementsReceived()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: simulationOutputMeasurements => {
          const simulationName = this._simulationQueue.getActiveSimulation().name;
          const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[simulationName];
          const measurementValueTables = [];
          for (const [nodeName, phases] of Object.entries(nodeNames)) {
            const measurements = {
              taps: [] as SimulationOutputMeasurement[],
              voltages: [] as SimulationOutputMeasurement[],
              powers: [] as SimulationOutputMeasurement[]
            };
            // Getting values for taps
            simulationOutputMeasurements.forEach(measurement => {
              if (
                measurement.conductingEquipmentName.includes(nodeName) &&
                measurement.type === 'Pos' &&
                phases.includes(measurement.phases) &&
                // Discard measurements with duplicate phases
                measurements.taps.find(e => e.phases === measurement.phases) === undefined
              ) {
                measurements.taps.push(measurement);
              }
            });

            if (!nodeName.includes('capbank') && !nodeName.includes('c83')) {
              // Getting measurements for voltages
              simulationOutputMeasurements.forEach(measurement => {
                if (
                  measurements.taps[0]?.connectivityNode === measurement.connectivityNode &&
                  measurement.type === 'PNV' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  measurements.voltages.find(e => e.phases === measurement.phases) === undefined
                ) {
                  measurements.voltages.push(measurement);
                }
              });
              measurements.voltages.sort((a, b) => a.phases.localeCompare(b.phases));

              // Getting measurements for powers
              simulationOutputMeasurements.forEach(measurement => {
                if (
                  measurement.conductingEquipmentName === 'hvmv_sub' &&
                  measurement.type === 'VA' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  measurements.powers.find(e => e.phases === measurement.phases) === undefined
                ) {
                  measurements.powers.push(measurement);
                }
              });
              measurements.powers.sort((a, b) => a.phases.localeCompare(b.phases));
            }
            measurementValueTables.push({
              nodeNameToAttachTo: nodeName,
              measurements
            });
          }
          this.setState({
            measurementValueTables
          });
        }
      });
  }

}
