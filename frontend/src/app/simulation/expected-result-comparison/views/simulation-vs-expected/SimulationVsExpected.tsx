/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { take } from 'rxjs/operators';

import { BasicButton, IconButton } from '@shared/buttons';
import { FilePickerService, FilePicker } from '@shared/file-picker';
import { Notification } from '@shared/overlay/notification';

import './SimulationVsExpected.light.scss';
import './SimulationVsExpected.dark.scss';

interface Props {
  onSubmit: (expectedResults: any, events: any[]) => void;
}

interface State {
  expectedResultsFileName: string;
  eventsFileName: string;
  disableSubmitButton: boolean;
}

export class SimulationVsExpected extends React.Component<Props, State> {

  private readonly _filePickerService = FilePickerService.getInstance();

  private _expectedResults: any = {};
  private _events: any[] = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      expectedResultsFileName: '',
      eventsFileName: '',
      disableSubmitButton: false
    };

    this.onUploadExpectedResultsFile = this.onUploadExpectedResultsFile.bind(this);
    this.onUploadEventsFile = this.onUploadEventsFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

  }

  render() {
    return (
      <div className='simulation-vs-expected'>
        <div className='simulation-vs-expected__file-upload'>
          <IconButton
            icon='cloud_upload'
            label='Upload expected results file'
            onClick={this.onUploadExpectedResultsFile} />
          <div className='simulation-vs-expected__file-upload__file-name'>
            {this.state.expectedResultsFileName ? 'File uploaded: ' + this.state.expectedResultsFileName : ''}
          </div>
        </div>
        <div className='simulation-vs-expected__file-upload'>
          <IconButton
            icon='cloud_upload'
            label='Upload events file'
            onClick={this.onUploadEventsFile} />
          <div className='simulation-vs-expected__file-upload__file-name'>
            {this.state.eventsFileName ? 'File uploaded: ' + this.state.eventsFileName : ''}
          </div>
        </div>
        <BasicButton
          type='positive'
          label='Submit'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmit} />
        <FilePicker />
      </div>
    );
  }

  onUploadExpectedResultsFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            expectedResultsFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: fileContent => {
          this._expectedResults = fileContent.expectedResults;
          this.setState({
            disableSubmitButton: false
          });
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            disableSubmitButton: true
          });
        }
      });
  }

  onUploadEventsFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            eventsFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any[]>()
      .subscribe({
        next: events => {
          this._events = events;
          this.setState({
            disableSubmitButton: false
          });
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            disableSubmitButton: true
          });
        }
      });
  }

  onSubmit() {
    this.props.onSubmit(this._expectedResults, this._events);
    this.setState({
      disableSubmitButton: true
    });
  }

}
