import * as React from 'react';
import { filter } from 'rxjs/operators';

import { Input, TextArea, FormControlModel, Form, FormGroupModel } from '@shared/form';
import { BasicButton, IconButton } from '@shared/buttons';
import { Wait } from '@shared/wait';
import { Tooltip } from '@shared/tooltip';
import { DownloadType } from '@shared/misc';
import { Validators } from '@shared/form/validation';

import './StompClient.light.scss';
import './StompClient.dark.scss';

interface Props {
  response: string;
  showLoadingIndicator: boolean;
  onRequestSubmitted: (topic: string, requestBody: string) => void;
  onDownloadResponse: (downloadType: DownloadType) => void;
}

interface State {
  disableCsvExport: boolean;
  disableSubmitButton: boolean;
}

export class StompClient extends React.Component<Props, State> {

  readonly formGroupModel = new FormGroupModel({
    topic: new FormControlModel(
      'goss.gridappsd.process.request.status.platform',
      [Validators.checkNotEmpty('Topic')]
    ),
    requestBody: new FormControlModel(
      '{}',
      [
        Validators.checkNotEmpty('Request Body'),
        Validators.checkValidJSON()
      ]
    )
  });

  readonly response = new FormControlModel(this.props.response);

  constructor(props: Props) {
    super(props);

    this.state = {
      disableCsvExport: true,
      disableSubmitButton: false
    };

    this.onSubmit = this.onSubmit.bind(this);

  }

  componentDidMount() {
    this.formGroupModel.findControl('topic')
      .valueChanges()
      .pipe(filter(topic => !topic.endsWith('timeseries')))
      .subscribe({
        next: () => {
          this.setState({
            disableCsvExport: true
          });
        }
      });

    this.formGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.response !== prevProps.response) {
      this.setState({
        disableCsvExport: !this.props.response || !this.formGroupModel.getValue().topic.endsWith('timeseries')
      });
      this.response.setValue(this.props.response);
    }
  }

  componentWillUnmount() {
    this.formGroupModel.cleanup();
  }

  render() {
    return (
      <>
        <Form
          className='stomp-client'
          formGroupModel={this.formGroupModel}>
          <Input
            className='stomp-client__topic'
            label='Topic'
            formControlModel={this.formGroupModel.findControl('topic')} />
          <TextArea
            className='stomp-client__request-body'
            label='Request'
            formControlModel={this.formGroupModel.findControl('requestBody')} />
          <BasicButton
            label='Send request'
            type='positive'
            className='stomp-client__send-request'
            disabled={this.state.disableSubmitButton}
            onClick={this.onSubmit} />
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
            formControlModel={this.response} />
        </Form>
        <Wait show={this.props.showLoadingIndicator} />
      </>
    );
  }

  onSubmit() {
    const formValue = this.formGroupModel.getValue();
    this.props.onRequestSubmitted(formValue.topic, formValue.requestBody);
  }

}
