/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import { take } from 'rxjs/operators';

import { BasicButton, IconButton } from '@client:common/buttons';
import { Select, SelectionOptionBuilder, FormControlModel } from '@client:common/form';
import { Notification } from '@client:common/overlay/notification';
import { FilePickerService, FilePicker } from '@client:common/file-picker';

import './ExpectedVsTimeSeries.light.scss';
import './ExpectedVsTimeSeries.dark.scss';

interface Props {
  simulationIds: string[];
  onSubmit: (expectedResults: any, simulationId: number) => void;
}

interface State {
  expectedResultsFileName: string;
  simulationIdOptionBuilder: SelectionOptionBuilder<string>;
  disableSubmitButton: boolean;
}

export class ExpectedVsTimeSeries extends Component<Props, State> {

  readonly simulationFormControl = new FormControlModel('');

  private readonly _filePickerService = FilePickerService.getInstance();

  private _expectedResults: any = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      expectedResultsFileName: '',
      simulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
      disableSubmitButton: true
    };

    this.onUploadExpectedResultsFile = this.onUploadExpectedResultsFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

  }

  componentDidMount() {
    this.simulationFormControl.validityChanges()
      .subscribe({
        next: isValid => {
          if (!isValid !== this.state.disableSubmitButton) {
            this.setState({
              disableSubmitButton: !isValid
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.simulationFormControl.cleanup();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.simulationIds !== this.props.simulationIds) {
      this.setState({
        simulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds)
      });
    }
  }

  render() {
    return (
      <div className='expected-vs-time-series'>
        <div className='expected-vs-time-series__file-upload'>
          <IconButton
            icon='cloud_upload'
            label='Upload expected results file'
            onClick={this.onUploadExpectedResultsFile} />
          <div className='expected-vs-time-series__file-upload__file-name'>
            {this.state.expectedResultsFileName ? 'File uploaded: ' + this.state.expectedResultsFileName : ''}
          </div>
        </div>
        <Select
          label='Simulation ID'
          selectionOptionBuilder={this.state.simulationIdOptionBuilder}
          formControlModel={this.simulationFormControl} />
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
    this.props.onSubmit(this._expectedResults, +this.simulationFormControl.getValue());
    this.setState({
      disableSubmitButton: true
    });
  }

}
