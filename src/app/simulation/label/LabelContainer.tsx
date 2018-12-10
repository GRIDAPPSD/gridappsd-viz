import * as React from 'react';
import { Subscription } from 'rxjs';

import { SimulationOutputService } from '../../services/SimulationOutputService';
import { Label } from './views/label/Label';

interface Props {
  topologyName: string;
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
  }
}

export class LabelContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
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
    this._simulationOutputMeasurementsStream = this._simulationOutputService.simulationOutputMeasurementsReceived()
      .subscribe(measurements => {
        const nodeNames: { [key: string]: string[] } = NODES_PER_TOPOLOGY[this.props.topologyName];
        const labels = [];
        for (const nodeName in nodeNames) {
          let content = [];
          // getting values for taps
          const filteredMeasurements = measurements.filter(m => m.conductingEquipmentName.includes(nodeName) && m.type === 'Pos');
          const measurementsAtPhases = [];
          // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
          filteredMeasurements.forEach(m => {
            if (nodeNames[nodeName].includes(m.phases) && measurementsAtPhases.findIndex(e => e.phases === m.phases) === -1)
              measurementsAtPhases.push(m);
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
            const voltages = measurements.filter(m => measurementsAtPhases[0].connectivityNode === m.connectivityNode && m.type === 'PNV');
            const voltagesAtPhases = [];
            // discard measures with phases that were already added
            voltages.forEach(m => {
              if (nodeNames[nodeName].includes(m.phases) && voltagesAtPhases.findIndex(e => e.phases === m.phases) === -1)
                voltagesAtPhases.push(m);
            });
            const powers = measurements.filter(m => m.conductingEquipmentName === 'hvmv_sub' && m.type === 'VA');
            const powersAtPhases = [];
            // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
            powers.forEach(m => {
              if (nodeNames[nodeName].includes(m.phases) && powersAtPhases.findIndex(e => e.phases === m.phases) === -1)
                powersAtPhases.push(m);
            });

            content.push(
              <tr key='header'>
                <th></th>
                <th>Voltage</th>
                <th>Tap</th>
                {nodeName === 'FEEDER_REG' && <th>Power in</th>}
              </tr>
            );
            const length = Math.min(measurementsAtPhases.length, voltagesAtPhases.length, powersAtPhases.length);
            for (let i = 0; i < length; i++) {
              content.push(
                <tr key={i}>
                  <td>{measurementsAtPhases[i].phases}</td>
                  <td>
                    {voltagesAtPhases[i].magnitude}
                    <span>&ang;</span>
                    {(voltagesAtPhases[i].angle > 0 ? '+' + voltagesAtPhases[i].angle : voltagesAtPhases[i].angle) + '  V'}
                  </td>
                  <td>{measurementsAtPhases[i].value}</td>
                  {
                    nodeName === 'FEEDER_REG' &&
                    <td>
                      {powersAtPhases[i].magnitude}
                      <span>&ang;</span>
                      {(voltagesAtPhases[i].angle > 0 ? '+' + voltagesAtPhases[i].angle : voltagesAtPhases[i].angle) + '  VA'}
                    </td>
                  }
                </tr>
              );
            }
          }
          labels.push(<Label key={nodeName} nodeNameToAttachTo={nodeName} content={<table>{content}</table>} />);
        }
        this.setState({ labels });
      });
  }
}