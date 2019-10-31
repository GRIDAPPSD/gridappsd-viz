import * as React from 'react';

import { Input, TextArea } from '@shared/form';
import { BasicButton, IconButton } from '@shared/buttons';
import { Wait } from '@shared/wait';
import { Tooltip } from '@shared/tooltip';
import { DownloadType } from '@shared/misc';

import './StompClient.light.scss';
import './StompClient.dark.scss';

interface Props {
  response: any;
  onRequestSubmitted: (topic: string, requestBody: string) => void;
  showLoadingIndicator: boolean;
  onDownloadResponse: (downloadType: DownloadType) => void;
}

interface State {
  topic: string;
  disableCsvExport: boolean;
}

export class StompClient extends React.Component<Props, State> {

  requestBody = '';

  constructor(props: Props) {
    super(props);
    this.state = {
      topic: 'goss.gridappsd.process.request.status.platform',
      disableCsvExport: true
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.response !== prevProps.response)
      this.setState({
        disableCsvExport: !this.props.response || !this.state.topic.endsWith('timeseries')
      });
  }

  render() {
    return (
      <>
        <form className='stomp-client'>
          <Input
            className='stomp-client__topic'
            label='Topic'
            name='topic'
            value={this.state.topic}
            onChange={value => {
              if (!value.endsWith('timeseries'))
                this.setState({
                  disableCsvExport: true
                });
              this.setState({
                topic: value
              });
            }} />
          <TextArea
            className='stomp-client__request-body'
            label='Request'
            value={this.requestBody}
            onChange={value => this.requestBody = value} />
          <BasicButton
            label='Send request'
            type='positive'
            className='stomp-client__send-request'
            onClick={() => this.props.onRequestSubmitted(this.state.topic, this.requestBody)} />
          <div className='stomp-client__download-types'>
            <Tooltip content='Download response as CSV'>
              <IconButton
                icon='arrow_downward'
                label='CSV'
                disabled={this.state.disableCsvExport}
                style='accent'
                onClick={() => this.props.onDownloadResponse(DownloadType.CSV)} />
            </Tooltip>
            <Tooltip content='Download response as JSON'>
              <IconButton
                icon='arrow_downward'
                label='JSON'
                style='accent'
                disabled={!this.props.response}
                onClick={() => this.props.onDownloadResponse(DownloadType.JSON)} />
            </Tooltip>
          </div>
          <TextArea
            className='stomp-client__response'
            readonly
            label='Response'
            value={this.props.response}
            onChange={null} />
        </form>
        <Wait show={this.props.showLoadingIndicator} />
      </>
    );
  }
}
