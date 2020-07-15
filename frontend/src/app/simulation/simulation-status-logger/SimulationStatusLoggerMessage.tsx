import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { SimulationStatusLogMessage } from '@shared/simulation';

import './SimulationStatusLoggerMessage.light.scss';
import './SimulationStatusLoggerMessage.dark.scss';

interface Props {
  message: SimulationStatusLogMessage;
}

interface State {
  showFormattedMessage: boolean;
}

export class SimulationStatusLoggerMessage extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      showFormattedMessage: false
    };

    this.showFormattedMessage = this.showFormattedMessage.bind(this);
    this.showAsString = this.showAsString.bind(this);
  }

  render() {
    return (
      <div className={'simulation-status-logger-message ' + this.props.message.logLevel}>
        {
          this.state.showFormattedMessage
            ? (
              <>
                <IconButton
                  size='small'
                  style='accent'
                  icon='remove'
                  onClick={this.showAsString} />
                <table>
                  <tbody>
                    {
                      Object.entries(this.props.message)
                        .map(([key, value]) => (
                          <tr key={key}>
                            <td>
                              <div>{key}</div>
                            </td>
                            <td>
                              <div>{value === '' ? '\'\'' : String(value)}</div>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </>
            )
            : (
              <>
                <IconButton
                  size='small'
                  style='accent'
                  icon='add'
                  onClick={this.showFormattedMessage} />
                <span className='simulation-status-logger-message__body'>
                  {this.props.message.logMessage}
                </span>
              </>
            )
        }
      </div>
    );
  }

  showFormattedMessage() {
    this.setState({
      showFormattedMessage: true
    });
  }

  showAsString() {
    this.setState({
      showFormattedMessage: false
    });
  }

}
