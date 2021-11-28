/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import { take } from 'rxjs/operators';

import { BasicButton, IconButton } from '@client:common/buttons';
import { Form, Select, FormControlModel, SelectionOptionBuilder } from '@client:common/form';
import { Notification } from '@client:common/overlay/notification';
import { FilePicker, FilePickerService } from '@client:common/file-picker';

import './SimulationVsTimeSeries.light.scss';
import './SimulationVsTimeSeries.dark.scss';

interface Props {
  simulationIds: string[];
  onSubmit: (simulationConfiguration: any | null, simulationId: number) => void;
}

interface State {
  simulationIdOptionBuilder: SelectionOptionBuilder<string>;
  simulationConfigurationFileName: string;
  disableSubmitButton: boolean;
}

export class SimulationVsTimeSeries extends Component<Props, State> {

  readonly simulationFormControl = new FormControlModel('');

  private readonly _filePickerService = FilePickerService.getInstance();

  private _simulationConfiguration: any = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
      simulationConfigurationFileName: '',
      disableSubmitButton: true
    };

    this.onUploadSimulationConfigurationFile = this.onUploadSimulationConfigurationFile.bind(this);
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
      <Form className='simulation-vs-time-series-form'>
        <Select
          label='Simulation ID'
          selectionOptionBuilder={this.state.simulationIdOptionBuilder}
          formControlModel={this.simulationFormControl} />
        <div className='simulation-vs-time-series__file-upload'>
          <IconButton
            icon='cloud_upload'
            label='Upload simulation configuration file'
            onClick={this.onUploadSimulationConfigurationFile} />
          <div className='simulation-vs-time-series__file-upload__file-name'>
            {this.state.simulationConfigurationFileName ? 'File uploaded: ' + this.state.simulationConfigurationFileName : ''}
          </div>
        </div>
        <BasicButton
          type='positive'
          label='Submit'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmit} />
        <FilePicker />
      </Form>
    );
  }

  onUploadSimulationConfigurationFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            simulationConfigurationFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: simulationConfiguration => this._simulationConfiguration = simulationConfiguration,
        error: errorMessage => {
          Notification.open(errorMessage);
          this._simulationConfiguration = null;
        }
      });
  }

  onSubmit() {
    this.props.onSubmit(this._simulationConfiguration, +this.simulationFormControl.getValue());
    this.setState({
      disableSubmitButton: true
    });
  }

}
