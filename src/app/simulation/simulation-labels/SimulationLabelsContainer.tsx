import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { SimulationOutputService, SimulationQueue, SimulationStatus, SimulationControlService } from '@shared/simulation';
import { SimulationLabel } from './SimulationLabel';

interface Props {
}

interface State {
  labels: React.ReactElement<SimulationLabel>[];
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

export class SimulationLabelsContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      labels: []
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
        filter(status => status === SimulationStatus.STARTED)
      )
      .subscribe({
        next: () => {
          this.setState({
            labels: []
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
      this.state.labels
    );
  }

  private _subscribeToSimulationOutputMeasurementsStream() {
    const simulationName = this._simulationQueue.getActiveSimulation().name;

    this._simulationOutputService.simulationOutputMeasurementsReceived()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: measurements => {
          const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[simulationName];
          const labels = [];
          for (const [nodeName, phases] of Object.entries(nodeNames)) {
            let content = [];
            // getting values for taps
            const measurementsAtPhases = [];
            measurements.forEach(measurement => {
              if (
                measurement.conductingEquipmentName.includes(nodeName) &&
                measurement.type === 'Pos' &&
                phases.includes(measurement.phases) &&
                // Discard measurements with duplicate phases
                measurementsAtPhases.find(e => e.phases === measurement.phases) === undefined
              ) {
                measurementsAtPhases.push(measurement);
              }
            });

            if (nodeName.includes('capbank') || nodeName.includes('c83')) {
              content = measurementsAtPhases.map(node => (
                <tr key={node.phases}>
                  <td>Switch {node.phases}</td>
                  <td>{node.value === 0 ? 'CLOSED' : 'OPEN'}</td>
                </tr>
              ));
            }
            else {
              // get measurements for voltages
              const voltagesAtPhases = [];
              measurements.forEach(measurement => {
                if (
                  measurementsAtPhases[0].connectivityNode === measurement.connectivityNode &&
                  measurement.type === 'PNV' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  voltagesAtPhases.find(e => e.phases === measurement.phases) === undefined
                ) {
                  voltagesAtPhases.push(measurement);
                }
              });
              voltagesAtPhases.sort((a, b) => a.phases.localeCompare(b.phases));

              const powersAtPhases = [];
              measurements.forEach(measurement => {
                if (
                  measurement.conductingEquipmentName === 'hvmv_sub' &&
                  measurement.type === 'VA' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  powersAtPhases.find(e => e.phases === measurement.phases) === undefined
                ) {
                  powersAtPhases.push(measurement);
                }
              });
              powersAtPhases.sort((a, b) => a.phases.localeCompare(b.phases));

              content.push(
                <tr key='header'>
                  <th></th>
                  <th>Voltage</th>
                  <th>Tap</th>
                  {nodeName === 'FEEDER_REG' && <th>Power in</th>}
                </tr>
              );
              const length = Math.max(measurementsAtPhases.length, voltagesAtPhases.length, powersAtPhases.length);
              for (let i = 0; i < length; i++) {
                content.push(
                  <tr key={i}>
                    <td>{measurementsAtPhases[i] && measurementsAtPhases[i].phases}</td>
                    <td>
                      {voltagesAtPhases[i] &&
                        <>
                          {voltagesAtPhases[i].magnitude}
                          <span>&ang;</span>
                          {(voltagesAtPhases[i].angle > 0 ? '+' + voltagesAtPhases[i].angle : voltagesAtPhases[i].angle) + '  V'}
                        </>
                      }
                    </td>
                    <td>{measurementsAtPhases[i] && measurementsAtPhases[i].value}</td>
                    {
                      nodeName === 'FEEDER_REG' &&
                      <td>
                        {powersAtPhases[i] &&
                          <>
                            {powersAtPhases[i].magnitude}
                            <span>&ang;</span>
                          </>
                        }
                        {voltagesAtPhases[i] &&
                          (voltagesAtPhases[i].angle > 0
                            ? '+' + voltagesAtPhases[i].angle
                            : voltagesAtPhases[i].angle)
                          + '  VA'
                        }
                      </td>
                    }
                  </tr>
                );
              }
            }
            labels.push(
              <SimulationLabel
                key={nodeName}
                nodeNameToAttachTo={nodeName}>
                <table>{content}</table>
              </SimulationLabel>
            );
          }
          this.setState({ labels });
        }
      });
  }

}
