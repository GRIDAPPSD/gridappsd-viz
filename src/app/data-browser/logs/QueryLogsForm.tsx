import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Input, Select, Option } from '@shared/form';
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

  constructor(props: any) {
    super(props);
    this.state = {
      selectedSimulationId: null
    };

    this.onSimulationIdSelected = this.onSimulationIdSelected.bind(this);
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
                options={this.props.simulationIds.map(id => new Option(`${id.process_id}`, id))}
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
                options={
                  ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(e => new Option(e, e))
                }
                isOptionSelected={option => option.label === 'ALL'}
                onChange={selectedOption => this.formValue.logLevel = selectedOption.value} />
              <Select
                multiple={false}
                label='Process status'
                options={
                  ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE'].map(e => new Option(e, e))
                }
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