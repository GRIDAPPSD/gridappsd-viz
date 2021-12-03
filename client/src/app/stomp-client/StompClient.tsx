import { Component } from 'react';
import { filter } from 'rxjs/operators';

import { Input, TextArea, FormControlModel, Form, FormGroupModel } from '@client:common/form';
import { BasicButton, IconButton } from '@client:common/buttons';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { Tooltip } from '@client:common/tooltip';
import { Validators } from '@client:common/form/validation';
import { DownloadType } from '@client:common/misc';

import './StompClient.light.scss';
import './StompClient.dark.scss';

interface Props {
  response: string;
  showLoadingIndicator: boolean;
  onRequestSubmitted: (destinationTopic: string, responseTopic: string, requestBody: string) => void;
  onDownloadResponse: (downloadType: DownloadType) => void;
}

interface State {
  disableCsvExport: boolean;
  disableSubmitButton: boolean;
}

export class StompClient extends Component<Props, State> {

  readonly formGroupModel = new FormGroupModel({
    destinationTopic: new FormControlModel(
      'goss.gridappsd.process.request.status.platform',
      [Validators.checkNotEmpty('Destination topic')]
    ),
    responseTopic: new FormControlModel(
      '/stomp-client/response-queue',
      [Validators.checkNotEmpty('Response topic')]
    ),
    requestBody: new FormControlModel(
      '{}',
      [
        Validators.checkNotEmpty('Request body'),
        Validators.checkValidJSON('Request body')
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
    this.formGroupModel.findControl('destinationTopic')
      .valueChanges()
      .pipe(filter(destinationTopic => !destinationTopic.endsWith('timeseries')))
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
        disableCsvExport: !this.props.response || !this.formGroupModel.getValue().destinationTopic.endsWith('timeseries')
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
            className='stomp-client__destination-topic'
            label='Destination topic'
            formControlModel={this.formGroupModel.findControl('destinationTopic')} />
          <Input
            className='stomp-client__response-topic'
            label='Response topic'
            formControlModel={this.formGroupModel.findControl('responseTopic')} />
          <TextArea
            type='plaintext'
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
            type='plaintext'
            className='stomp-client__response'
            readonly
            label='Response'
            formControlModel={this.response} />
        </Form>
        <ProgressIndicator show={this.props.showLoadingIndicator} />
      </>
    );
  }

  onSubmit() {
    const formValue = this.formGroupModel.getValue();
    this.props.onRequestSubmitted(formValue.destinationTopic, formValue.responseTopic, formValue.requestBody);
  }

}
