import * as React from 'react';

import { IconButton } from '@shared/buttons';

import './SimulationStatusLogMessage.scss';

interface Props {
  message: string;
}

interface State {
  showMessageAsJson: boolean;
  messageAsJson: any;
}

export class SimulationStatusLogMessage extends React.Component<Props, State> {
  private _messageElement: HTMLElement = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      showMessageAsJson: false,
      messageAsJson: JSON.parse(this.props.message)
    };
    this._showAsJson = this._showAsJson.bind(this);
    this._showAsString = this._showAsString.bind(this);
  }
  render() {
    return (
      <div
        className={'simulation-status-log-message ' + this.state.messageAsJson.logLevel}
        ref={elem => this._messageElement = elem}>
        {
          this.state.showMessageAsJson
            ?
            <>
              <IconButton
                size='small'
                style='accent'
                icon='remove'
                onClick={this._showAsString} />
              <span>
                {JSON.stringify(this.state.messageAsJson, null, 4)}
              </span>
            </>
            :
            <>
              <IconButton
                size='small'
                style='accent'
                icon='add'
                onClick={this._showAsJson} />
              <span className='simulation-status-log-message__content'>
                {this.state.messageAsJson.logMessage}
              </span>
            </>
        }
      </div>
    );
  }
  private _showAsJson() {
    this.setState({ showMessageAsJson: true });
    this._messageElement.classList.add('highlight');
    // setTimeout(() => this._messageElement.scrollIntoView(), 0);
  }

  private _showAsString() {
    this._messageElement.classList.remove('highlight');
    this.setState({ showMessageAsJson: false });
  }
}