import { Component } from 'react';

import { Input, Select, SelectionOptionBuilder, Form, FormGroupModel, FormControlModel } from '@client:common/form';
import { BasicButton } from '@client:common/buttons';
import { Validators } from '@client:common/form/validation';
import { DateTimeService } from '@client:common/DateTimeService';

import { QueryLogsRequestBody } from '../../models/QueryLogsRequestBody';
import { SimulationId } from '../../models/SimulationId';

import './QueryLogsForm.light.scss';
import './QueryLogsForm.dark.scss';

interface Props {
  simulationIds: SimulationId[];
  sources: string[];
  onSubmit: (body: QueryLogsRequestBody) => void;
  onSimulationIdSelected: (simulationId: SimulationId) => void;
}

interface State {
  selectedSimulationId: SimulationId;
  simulationIdOptionBuilder: SelectionOptionBuilder<SimulationId>;
  sourceOptionBuilder: SelectionOptionBuilder<string>;
  logLevelOptionBuilder: SelectionOptionBuilder<string>;
  processStatusOptionBuilder: SelectionOptionBuilder<string>;
  disableSubmitButton: boolean;
}

/**
 * Represents the form that is displayed after selecting "Browse Data" in the drawer menu,
 * then selecting "LOGS" tab
 */
export class QueryLogsForm extends Component<Props, State> {

  readonly formGroupModel = new FormGroupModel({
    startTime: new FormControlModel(
      Date.now() / 1000,
      [
        Validators.checkNotEmpty('Start time'),
        Validators.checkValidDateTime('Start time')
      ]
    ),
    simulationId: new FormControlModel<SimulationId>(null),
    username: new FormControlModel('system', [Validators.checkNotEmpty('Username')]),
    source: new FormControlModel('ALL'),
    logLevel: new FormControlModel('ALL'),
    processStatus: new FormControlModel('ALL')
  });

  private readonly _dateTimeService = DateTimeService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedSimulationId: null,
      simulationIdOptionBuilder: new SelectionOptionBuilder(
        props.simulationIds,
        simulationId => simulationId.process_id
      ),
      sourceOptionBuilder: new SelectionOptionBuilder(props.sources),
      logLevelOptionBuilder: new SelectionOptionBuilder(
        ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
      ),
      processStatusOptionBuilder: new SelectionOptionBuilder(
        ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE']
      ),
      disableSubmitButton: true
    };

    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  componentDidMount() {
    this.formGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });
    const simulationIdFormControl = this.formGroupModel.findControl('simulationId');
    simulationIdFormControl.valueChanges()
      .subscribe({
        next: (simulationId: SimulationId) => {
          if (simulationIdFormControl.isValid()) {
            this.props.onSimulationIdSelected(simulationId);
            this.formGroupModel.findControl('startTime').setValue(this._dateTimeService.parse(simulationId.timestamp));
          }
        }
      });
  }

  componentWillUnmount() {
    this.formGroupModel.cleanup();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.simulationIds !== prevProps.simulationIds) {
      this.setState({
        simulationIdOptionBuilder: new SelectionOptionBuilder(
          this.props.simulationIds,
          simulationId => simulationId.process_id
        )
      });
    }
    if (this.props.sources !== prevProps.sources) {
      this.setState({
        sourceOptionBuilder: new SelectionOptionBuilder(this.props.sources)
      });
    }
  }

  render() {
    return (
      <Form className='query-logs-form'>
        <div className='query-logs-form__panel-container'>
          <div className='query-logs-form__panel left'>
            <Input
              label='Start time'
              type='datetime'
              formControlModel={this.formGroupModel.findControl('startTime')} />
            <Select
              label='Simulation ID'
              formControlModel={this.formGroupModel.findControl('simulationId')}
              selectionOptionBuilder={this.state.simulationIdOptionBuilder} />
            <Input
              label='Username'
              formControlModel={this.formGroupModel.findControl('username')} />
          </div>
          <div className='query-logs-form__panel right'>
            <Select
              label='Source'
              formControlModel={this.formGroupModel.findControl('source')}
              selectionOptionBuilder={this.state.sourceOptionBuilder}
              selectedOptionFinder={source => source === 'ALL'} />
            <Select
              label='Log level'
              formControlModel={this.formGroupModel.findControl('logLevel')}
              selectionOptionBuilder={this.state.logLevelOptionBuilder}
              selectedOptionFinder={level => level === 'ALL'} />
            <Select
              label='Process status'
              formControlModel={this.formGroupModel.findControl('processStatus')}
              selectionOptionBuilder={this.state.processStatusOptionBuilder}
              selectedOptionFinder={status => status === 'ALL'} />
          </div>
        </div>
        <BasicButton
          className='query-logs-form__submit'
          label='Submit'
          type='positive'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmitForm} />
      </Form>
    );
  }

  onSubmitForm() {
    const formValue = this.formGroupModel.getValue();
    const requestBody: QueryLogsRequestBody = {
      startTime: this._dateTimeService.format(formValue.startTime),
      processId: formValue.simulationId.process_id,
      username: formValue.username,
      source: formValue.source,
      processStatus: formValue.processStatus,
      logLevel: formValue.logLevel
    };
    this.props.onSubmit(requestBody);
  }

}
