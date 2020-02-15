import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { SimulationQueue, SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
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
        filter(status => status === SimulationStatus.STARTED && this._simulationControlService.isUserInActiveSimulation())
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
    this._simulationControlService.simulationOutputMeasurementsReceived()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: measurements => {
          const simulationName = this._simulationQueue.getActiveSimulation().name;
          const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[simulationName];
          const labels = [];
          for (const [nodeName, phases] of Object.entries(nodeNames)) {
            let content = [];
            // getting values for taps
            const tapMeasurementsAtPhases = [];
            measurements.forEach(measurement => {
              if (
                measurement.conductingEquipmentName.includes(nodeName) &&
                measurement.type === 'Pos' &&
                phases.includes(measurement.phases) &&
                // Discard measurements with duplicate phases
                tapMeasurementsAtPhases.find(e => e.phases === measurement.phases) === undefined
              ) {
                tapMeasurementsAtPhases.push(measurement);
              }
            });

            if (nodeName.includes('capbank') || nodeName.includes('c83')) {
              content = tapMeasurementsAtPhases.map(node => (
                <tr key={node.phases}>
                  <td>Switch {node.phases}</td>
                  <td>{node.value === 0 ? 'CLOSED' : 'OPEN'}</td>
                </tr>
              ));
            } else {
              // get measurements for voltages
              const voltageMeasurementsAtPhases = [];
              measurements.forEach(measurement => {
                if (
                  tapMeasurementsAtPhases[0].connectivityNode === measurement.connectivityNode &&
                  measurement.type === 'PNV' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  voltageMeasurementsAtPhases.find(e => e.phases === measurement.phases) === undefined
                ) {
                  voltageMeasurementsAtPhases.push(measurement);
                }
              });
              voltageMeasurementsAtPhases.sort((a, b) => a.phases.localeCompare(b.phases));

              const powerMeasurementsAtPhases = [];
              measurements.forEach(measurement => {
                if (
                  measurement.conductingEquipmentName === 'hvmv_sub' &&
                  measurement.type === 'VA' &&
                  phases.includes(measurement.phases) &&
                  // Discard measurements with duplicate phases
                  powerMeasurementsAtPhases.find(e => e.phases === measurement.phases) === undefined
                ) {
                  powerMeasurementsAtPhases.push(measurement);
                }
              });
              powerMeasurementsAtPhases.sort((a, b) => a.phases.localeCompare(b.phases));

              content.push(
                <tr key='header'>
                  <th></th>
                  <th>Voltage</th>
                  <th>Tap</th>
                  {nodeName === 'FEEDER_REG' && <th>Power in</th>}
                </tr>
              );
              const length = Math.max(tapMeasurementsAtPhases.length, voltageMeasurementsAtPhases.length, powerMeasurementsAtPhases.length);
              for (let i = 0; i < length; i++) {
                content.push(
                  <tr key={i}>
                    <td>{tapMeasurementsAtPhases[i] && tapMeasurementsAtPhases[i].phases}</td>
                    <td>
                      {
                        voltageMeasurementsAtPhases[i]
                        &&
                        <>
                          {voltageMeasurementsAtPhases[i].magnitude}
                          <span>&ang;</span>
                          {(voltageMeasurementsAtPhases[i].angle > 0 ? '+' + voltageMeasurementsAtPhases[i].angle : voltageMeasurementsAtPhases[i].angle) + '  V'}
                        </>
                      }
                    </td>
                    <td>{tapMeasurementsAtPhases[i] && tapMeasurementsAtPhases[i].value}</td>
                    {
                      nodeName === 'FEEDER_REG'
                      &&
                      <td>
                        {powerMeasurementsAtPhases[i] &&
                          <>
                            {powerMeasurementsAtPhases[i].magnitude}
                            <span>&ang;</span>
                          </>
                        }
                        {voltageMeasurementsAtPhases[i] &&
                          (voltageMeasurementsAtPhases[i].angle > 0
                            ? '+' + voltageMeasurementsAtPhases[i].angle
                            : voltageMeasurementsAtPhases[i].angle)
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
