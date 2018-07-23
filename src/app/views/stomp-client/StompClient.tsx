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
          <div className='gridappsd-form-control'>
            <label className='gridappsd-form-control__label'>Topic</label>
            <span className='gridappsd-form-control__ripple-input-field'>
              <input
                type='text'
                name='topic'
                className='topic gridappsd-form-control__ripple-input-field__input'
                onChange={event => {
                  this.setState({ topic: (event.target as HTMLInputElement).value });
                }}
                value={this.state.topic} />
              <span className='gridappsd-form-control__ripple-input-field__ripple-bar'></span>
            </span>
          </div>
          <div className='gridappsd-form-control'>
            <label className='gridappsd-form-control__label'>Request</label>
            <textarea
              className='request-body gridappsd-form-control__multiline-input'
              name='request-body'
              onChange={event => {
                this.setState({ requestBody: (event.target as HTMLTextAreaElement).value });
              }}
              value={this.state.requestBody}></textarea>
          </div>
          <div className='gridappsd-form-control'>
            <label className='gridappsd-form-control__label'></label>
            <button
              type='button'
              onClick={() => this.props.onRequestSubmitted(this.state.topic, this.state.requestBody)}
              className='positive send-request'>
              Send request
            </button>
          </div>
          <div className='gridappsd-form-control'>
            <label className='gridappsd-form-control__label'>Response</label>
            <div className='response gridappsd-form-control__multiline-input'>
              {this.props.response}
            </div>
          </div>
        </form>
        <Wait show={!this.props.isDone} />
      </>
    );
  }
}