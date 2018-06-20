import * as React from 'react';

import { Wait } from '../wait/Wait';
import './StompClient.styles.scss';

interface Props {
  response: any;
  onRequestSubmitted: (topic: string, requestBody) => void;
  isDone: boolean;
}

interface State {
  topic: string;
  requestBody: string;
}

export class StompClient extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      topic: 'goss.gridappsd.process.request.status.platform',
      requestBody: ''
    };
  }
  render() {
    return (
      <>
        <form className='stomp-client-form'>
          <div className='control'>
            <label>Topic</label>
            <span className='input-field ripple'>
              <input
                type='text'
                name='topic'
                className='topic'
                onChange={event => {
                  this.setState({ topic: (event.target as HTMLInputElement).value });
                }}
                value={this.state.topic} />
              <span className='ripple-bar'></span>
            </span>
          </div>
          <div className='control'>
            <label>Request</label>
            <textarea
              className='request-body'
              name='request-body'
              onChange={event => {
                this.setState({ requestBody: (event.target as HTMLTextAreaElement).value });
              }}
              value={this.state.requestBody}></textarea>
            <button
              type='button'
              onClick={() => this.props.onRequestSubmitted(this.state.topic, this.state.requestBody)}
              className='positive send-request'>
              Send request
            </button>
          </div>
          <div className='control'>
            <label>Response</label>
            <div className='response'>
              {this.props.response}
            </div>
          </div>
        </form>
        <Wait show={!this.props.isDone}/>
      </>
    );
  }
}