import * as React from 'react';

import { IconButton } from '@shared/buttons';

import './SimulationStatusLogMessage.scss';

interface Props {
  message: string;
}

interface State {
  showMessageAsJson: boolean;
}

export class SimulationStatusLogMessage extends React.Component<Props, State> {
  private _messageElement: HTMLElement = null;

  constructor(props: any) {
    super(props);
    this.state = {
      showMessageAsJson: false
    };
    this._showAsJson = this._showAsJson.bind(this);
    this._showAsString = this._showAsString.bind(this);
  }
  render() {
    return (
      <div className='simulation-status-log-message' ref={elem => this._messageElement = elem}>
        {
          this.state.showMessageAsJson
            ?
            <>
              <IconButton
                icon='minus'
                onClick={this._showAsString} />
              <span>
                {JSON.stringify(JSON.parse(this.props.message), null, 4)}
              </span>
            </>
            :
            <>
              <IconButton
                icon='plus'
                onClick={this._showAsJson} />
              <span className='simulation-status-log-message__content'>
                {JSON.parse(this.props.message).logMessage}
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