import * as React from 'react';

import { Input, TextArea } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Wait } from '@shared/wait';

import './StompClient.styles.scss';
import { FormControl } from '@shared/form/form-control/FormControl';

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
          <Input
            className='stomp-client-form__topic'
            label='Topic'
            name='topic'
            value={this.state.topic}
            onChange={value => this.setState({ topic: value })} />
          <TextArea
            className='stomp-client-form__request-body'
            label='Request'
            value={this.state.requestBody}
            onUpdate={value => this.setState({ requestBody: value })} />
          <BasicButton
            label='Send request'
            type='positive'
            className='stomp-client__send-request'
            onClick={() => this.props.onRequestSubmitted(this.state.topic, this.state.requestBody)} />
          <TextArea
            className='stomp-client-form__response'
            label='Response'
            value={this.props.response}
            onUpdate={null} />
        </form>
        <Wait show={!this.props.isDone} />
      </>
    );
  }
}