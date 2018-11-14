import * as React from 'react';

import { QueryLogs } from './views/QueryLogs';
import { SimulationQueue } from '../services/SimulationQueue';

interface Props {
  onClose: () => void;
}

interface State {
  response;
}

export class QueryLogsContainer extends React.Component<Props, State> {
  private readonly _simulationQueue = SimulationQueue.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
      response: 'what'
    };
  }

  render() {
    return (
      <QueryLogs
        simulations={this._simulationQueue.getAllSimulations()}
        response={this.state.response}
        onClose={this.props.onClose}
        onSubmit={data => {
        }} />
    );
  }
}