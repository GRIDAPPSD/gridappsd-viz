import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Input, Select, Option } from '@shared/form';
import { toOptions } from '@shared/form/select/utils';
import { BasicButton } from '@shared/buttons';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';

import './QueryLogsForm.scss';

interface Props {
  onSubmit: (body: QueryLogsRequestBody) => void;
  onSimulationIdSelected: (simulationId: SimulationId) => void;
  simulationIds: SimulationId[];
  sources: string[];
}

interface State {
  selectedSimulationId: SimulationId;
  simulationIdOptions: Option<SimulationId>[];
  logLevelOptions: Option<string>[];
  processStatusOptions: Option<string>[];
}

export class QueryLogsForm extends React.Component<Props, State> {

  readonly formValue: QueryLogsRequestBody = {
    startTime: '',
    processId: '',
    username: 'system',
    source: 'ALL',
    processStatus: 'ALL',
    logLevel: 'ALL'
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedSimulationId: null,
      simulationIdOptions: toOptions(props.simulationIds, simulationId => simulationId.process_id),
      logLevelOptions: toOptions(['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'], level => level),
      processStatusOptions: toOptions(
        ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE'],
        processStatus => processStatus
      )
    };

    this.onSimulationIdSelected = this.onSimulationIdSelected.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.simulationIds !== prevProps.simulationIds)
      this.setState({
        simulationIdOptions: toOptions(this.props.simulationIds, simulationId => simulationId.process_id)
      });
  }

  render() {
    return (
      <>
        <RequestEditor styles={{ overflow: 'initial', borderRadius: 'initial', boxShadow: 'initial', height: 'initial' }}>
          <form className='query-logs-form'>
            <div className='query-logs-form__left'>
              <Input
                label='Start time'
                name='startTime'
                value={this.state.selectedSimulationId ? this.state.selectedSimulationId.timestamp : ''}
                onChange={value => this.formValue.startTime = value} />
              <Select
                multiple={false}
                label='Simulation ID'
                options={this.state.simulationIdOptions}
                onChange={this.onSimulationIdSelected} />
              <Input
                label='Username'
                name='username'
                value='system'
                onChange={value => this.formValue.username = value} />
            </div>
            <div className='query-logs-form__right'>
              <Select
                multiple={false}
                label='Source'
                options={this.props.sources.map(source => new Option(source, source))}
                isOptionSelected={(_, index) => index === 0}
                onChange={selectedOption => this.formValue.source = selectedOption.value} />
              <Select
                multiple={false}
                label='Log level'
                options={this.state.logLevelOptions}
                isOptionSelected={option => option.label === 'ALL'}
                onChange={selectedOption => this.formValue.logLevel = selectedOption.value} />
              <Select
                multiple={false}
                label='Process status'
                options={this.state.processStatusOptions}
                isOptionSelected={option => option.label === 'ALL'}
                onChange={selectedOption => this.formValue.processStatus = selectedOption.value} />
            </div>
          </form>
        </RequestEditor>
        <BasicButton
          className='query-logs-form__submit'
          label='Submit'
          type='positive'
          onClick={event => {
            event.stopPropagation();
            this.props.onSubmit(this.formValue);
          }} />

      </>
    );
  }

  onSimulationIdSelected(selectedOption: Option<SimulationId>) {
    const simulationId = selectedOption.value;
    this.setState({ selectedSimulationId: simulationId });
    this.props.onSimulationIdSelected(simulationId);
    this.formValue.processId = simulationId.process_id;
    this.formValue.startTime = simulationId.timestamp;
  }

}
