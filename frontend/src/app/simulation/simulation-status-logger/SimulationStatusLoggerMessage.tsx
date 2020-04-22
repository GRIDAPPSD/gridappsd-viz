import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { SimulationStatusLogMessage } from '@shared/simulation';

import './SimulationStatusLoggerMessage.light.scss';
import './SimulationStatusLoggerMessage.dark.scss';

interface Props {
  message: SimulationStatusLogMessage;
}

interface State {
  showMessageAsJson: boolean;
}

export class SimulationStatusLoggerMessage extends React.Component<Props, State> {

  readonly messageElementRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      showMessageAsJson: false
    };
    this.showAsJson = this.showAsJson.bind(this);
    this.showAsString = this.showAsString.bind(this);
  }
  render() {
    return (
      <div
        className={'simulation-status-logger-message ' + this.props.message.logLevel}
        ref={this.messageElementRef}>
        {
          this.state.showMessageAsJson
            ?
            <>
              <IconButton
                size='small'
                style='accent'
                icon='remove'
                onClick={this.showAsString} />
              <span>
                {JSON.stringify(this.props.message, null, 4)}
              </span>
            </>
            :
            <>
              <IconButton
                size='small'
                style='accent'
                icon='add'
                onClick={this.showAsJson} />
              <span className='simulation-status-logger-message__body'>
                {this.props.message.logMessage}
              </span>
            </>
        }
      </div>
    );
  }

  showAsJson() {
    this.setState({
      showMessageAsJson: true
    });
    this.messageElementRef.current.classList.add('highlight');
  }

  showAsString() {
    this.setState({
      showMessageAsJson: false
    });
    this.messageElementRef.current.classList.remove('highlight');
  }

}
