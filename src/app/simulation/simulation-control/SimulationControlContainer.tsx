import * as React from 'react';

import { SimulationControlService } from '../../services/SimulationControlService';
import { SimulationControl } from './SimulationControl';
import { SimulationConfig } from '../../models/SimulationConfig';

interface Props {
  simulationConfig: SimulationConfig;
}

interface State {
}

export class SimulationControlContainer extends React.Component<Props, State> {
  private _simulationControlService = SimulationControlService.getInstance();

  constructor(props: any) {
    super(props);

    this._startSimulation = this._startSimulation.bind(this);
  }

  render() {
    return <SimulationControl timestamp='' onStartSimulation={this._startSimulation} />;
  }

  private _startSimulation() {
    this._simulationControlService.startSimulation(this.props.simulationConfig);
  }

}