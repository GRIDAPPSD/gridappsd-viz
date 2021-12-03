import { Component } from 'react';

import { IconButton } from '@client:common/buttons';

import './VoltageViolation.light.scss';
import './VoltageViolation.dark.scss';

interface Props {
  totalVoltageViolations: number;
  numberOfViolationsAtZero: number;
  timestamp: string;
}

interface State {
  tableVisible: boolean;
}

export class VoltageViolation extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      tableVisible: true
    };

    this.toggleTable = this.toggleTable.bind(this);
  }

  render() {
    return (
      <section className={`voltage-violation${this.state.tableVisible ? ' open' : ''}`}>
        <IconButton
          icon={this.state.tableVisible ? 'remove' : 'add'}
          size='small'
          hasBackground={false}
          onClick={this.toggleTable} />
        <table>
          <tbody>
            <tr>
              <td>
                <div>Timestamp</div>
              </td>
              <td>
                <div>{this.props.timestamp}</div>
              </td>
            </tr>
            <tr>
              <td>
                <div>Total voltage violations</div>
              </td>
              <td>
                <div>{this.props.totalVoltageViolations}</div>
              </td>
            </tr>
            <tr>
              <td>
                <div>Violations at 0</div>
              </td>
              <td>
                <div>{this.props.numberOfViolationsAtZero}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    );
  }

  toggleTable() {
    this.setState({
      tableVisible: !this.state.tableVisible
    });
  }

}
