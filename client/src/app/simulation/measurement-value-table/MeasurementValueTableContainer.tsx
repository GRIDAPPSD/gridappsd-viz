import { Component } from 'react';
import { Subscription, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { SimulationQueue, SimulationManagementService, SimulationOutputMeasurement } from '@client:common/simulation';
import { MeasurementType } from '@client:common/topology';
import { SimulationStatus } from '@project:common/SimulationStatus';

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
  // eslint-disable-next-line camelcase
  ieee8500new_335: {
    // eslint-disable-next-line camelcase
    feeder_reg1: ['A', 'B', 'C'],
    // eslint-disable-next-line camelcase
    feeder_reg2: ['A', 'B', 'C'],
    // eslint-disable-next-line camelcase
    feeder_reg3: ['A', 'B', 'C']
  }
};

export class MeasurementValueTableContainer extends Component<Props, State> {

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  private _activeSimulationStream: Subscription = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      measurementValueTables: []
    };

  }

  componentDidMount() {
    this._observeActiveSimulationChangeEvent();
    this._subscribeToSimulationOutputMeasurementMapStream();
    this._resetLabelsWhenSimulationStarts();
  }

  private _observeActiveSimulationChangeEvent() {
    this._activeSimulationStream = this._simulationQueue.queueChanges()
      .subscribe({
        next: () => {
          this._clearMeasurementValueTable();
        }
      });
  }

  private _clearMeasurementValueTable() {
    this.setState({
      measurementValueTables: []
    });
  }

  private _resetLabelsWhenSimulationStarts() {
    this._simulationManagementService.simulationStatusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationManagementService.isUserInActiveSimulation())
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
    this._activeSimulationStream.unsubscribe();
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

  private _subscribeToSimulationOutputMeasurementMapStream() {
    this._simulationManagementService.simulationOutputMeasurementMapReceived()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: simulationOutputMeasurements => {
          const simulationName = this._simulationQueue.getActiveSimulation().name;
          const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[simulationName];
          if (nodeNames) {
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
                  measurement.type === MeasurementType.TAP &&
                  measurement.conductingEquipmentName.includes(nodeName) &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  measurements.taps.find(e => e.phases === measurement.phases) === undefined
                ) {
                  measurements.taps.push(measurement);
                }
              });

              if (!nodeName.includes('capbank') && !nodeName.includes('c83')) {
                simulationOutputMeasurements.forEach(measurement => {
                  // Getting measurements for voltages
                  if (
                    measurement.type === MeasurementType.VOLTAGE &&
                    measurements.taps[0]?.connectivityNode === measurement.connectivityNode &&
                    phases.includes(measurement.phases) &&
                    // Discard measurements with duplicate phases
                    measurements.voltages.find(e => e.phases === measurement.phases) === undefined
                  ) {
                    measurements.voltages.push(measurement);
                  }

                  // Getting measurements for powers
                  if (
                    measurement.type === MeasurementType.POWER &&
                    measurement.conductingEquipmentName === 'hvmv_sub' &&
                    phases.includes(measurement.phases) &&
                    // Discard measurements with duplicate phases
                    measurements.powers.find(e => e.phases === measurement.phases) === undefined
                  ) {
                    measurements.powers.push(measurement);
                  }
                });
                measurements.taps.sort((a, b) => a.phases.localeCompare(b.phases));
                measurements.voltages.sort((a, b) => a.phases.localeCompare(b.phases));
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
        }
      });
  }

}
