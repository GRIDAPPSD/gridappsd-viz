import * as React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';

import './SimulationStatusLogMessage.styles.scss';

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
      <div className='message' ref={elem => this._messageElement = elem}>
        {
          this.state.showMessageAsJson
            ?
            <>
              <Button onClick={this._showAsString} className='show-as-string'><Glyphicon glyph='minus' /></Button>
              <span>
                {JSON.stringify(JSON.parse(this.props.message), null, 4)}
              </span>
            </>
            :
            <>
              <Button onClick={this._showAsJson} className='show-as-json'><Glyphicon glyph='plus' /></Button>
              <span>
                {this.props.message}
              </span>
            </>
        }
      </div>
    );
  }
  private _showAsJson() {
    this.setState({ showMessageAsJson: true });
    setTimeout(() => this._messageElement.scrollIntoView(), 0);
  }
  
  private _showAsString() {
    this.setState({ showMessageAsJson: false });
  }
}