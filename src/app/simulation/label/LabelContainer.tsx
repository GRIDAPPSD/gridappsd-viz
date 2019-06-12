import * as React from 'react';
import { Subscription } from 'rxjs';

import { SimulationOutputService, SimulationQueue } from '@shared/simulation';
import { Label } from './Label';

interface Props {
}

interface State {
  labels: React.ReactElement<Label>[];
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
  }
}

export class LabelContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private _simulationOutputMeasurementsStream: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      labels: []
    };
  }

  componentDidMount() {
    this._subscribeToSimulationOutputMeasurementsStream();
  }

  componentWillUnmount() {
    this._simulationOutputMeasurementsStream.unsubscribe();
  }

  render() {
    return (
      this.state.labels
    );
  }

  private _subscribeToSimulationOutputMeasurementsStream() {
    const simulationName = this._simulationQueue.getActiveSimulation().name;

    this._simulationOutputMeasurementsStream = this._simulationOutputService.simulationOutputMeasurementsReceived()
      .subscribe({
        next: measurements => {
          const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[simulationName];
          const labels = [];
          for (const [nodeName, phases] of Object.entries(nodeNames)) {
            let content = [];
            // getting values for taps
            const filteredMeasurements = measurements.filter(
              m => m.conductingEquipmentName.includes(nodeName) && m.type === 'Pos'
            );
            // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
            const measurementsAtPhases = filteredMeasurements.reduce(
              (measurementsAtPhases, m) => {
                if (phases.includes(m.phases) && measurementsAtPhases.findIndex(e => e.phases === m.phases) === -1)
                  measurementsAtPhases.push(m);
                return measurementsAtPhases;
              },
              []
            ).sort((a, b) => a.phases.localeCompare(b.phases));

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
              const voltages = measurements.filter(
                m => measurementsAtPhases[0].connectivityNode === m.connectivityNode && m.type === 'PNV'
              );
              const voltagesAtPhases = voltages.reduce(
                (voltagesAtPhases, m) => {
                  // discard measures with phases that were already added
                  if (phases.includes(m.phases) && voltagesAtPhases.findIndex(e => e.phases === m.phases) === -1)
                    voltagesAtPhases.push(m);
                  return voltagesAtPhases;
                },
                []
              ).sort((a, b) => a.phases.localeCompare(b.phases));

              const powers = measurements.filter(m => m.conductingEquipmentName === 'hvmv_sub' && m.type === 'VA');
              const powersAtPhases = powers.reduce(
                (powersAtPhases, m) => {
                  // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
                  if (phases.includes(m.phases) && powersAtPhases.findIndex(e => e.phases === m.phases) === -1)
                    powersAtPhases.push(m);
                  return powersAtPhases;
                },
                []
              ).sort((a, b) => a.phases.localeCompare(b.phases));

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
            labels.push(<Label key={nodeName} nodeNameToAttachTo={nodeName} content={<table>{content}</table>} />);
          }
          this.setState({ labels });
        }
      });
  }

}
