import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Input, Select, SelectionOptionBuilder } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';

import './QueryLogsForm.light.scss';
import './QueryLogsForm.dark.scss';

interface Props {
  onSubmit: (body: QueryLogsRequestBody) => void;
  onSimulationIdSelected: (simulationId: SimulationId) => void;
  simulationIds: SimulationId[];
  sources: string[];
}

interface State {
  selectedSimulationId: SimulationId;
  simulationIdOptionBuilder: SelectionOptionBuilder<SimulationId>;
  logLevelOptionBuilder: SelectionOptionBuilder<string>;
  processStatusOptionBuilder: SelectionOptionBuilder<string>;
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
      simulationIdOptionBuilder: new SelectionOptionBuilder(
        props.simulationIds,
        simulationId => simulationId.process_id
      ),
      logLevelOptionBuilder: new SelectionOptionBuilder(
        ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
      ),
      processStatusOptionBuilder: new SelectionOptionBuilder(
        ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE']
      )
    };

    this.onSimulationIdSelected = this.onSimulationIdSelected.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.simulationIds !== prevProps.simulationIds)
      this.setState({
        simulationIdOptionBuilder: new SelectionOptionBuilder(
          this.props.simulationIds,
          simulationId => simulationId.process_id
        )
      });
  }

  render() {
    return (
      <>
        <RequestEditor>
          <form className='query-logs-form'>
            <div className='query-logs-form__left'>
              <Input
                label='Start time'
                name='startTime'
                value={this.state.selectedSimulationId ? this.state.selectedSimulationId.timestamp : ''}
                onChange={value => this.formValue.startTime = value} />
              <Select
                label='Simulation ID'
                selectionOptionBuilder={this.state.simulationIdOptionBuilder}
                onChange={this.onSimulationIdSelected} />
              <Input
                label='Username'
                name='username'
                value='system'
                onChange={value => this.formValue.username = value} />
            </div>
            <div className='query-logs-form__right'>
              <Select
                label='Source'
                selectionOptionBuilder={new SelectionOptionBuilder(this.props.sources)}
                selectedOptionFinder={(_, index) => index === 0}
                onChange={selectedValue => this.formValue.source = selectedValue} />
              <Select
                label='Log level'
                selectionOptionBuilder={this.state.logLevelOptionBuilder}
                selectedOptionFinder={level => level === 'ALL'}
                onChange={selectedValue => this.formValue.logLevel = selectedValue} />
              <Select
                label='Process status'
                selectionOptionBuilder={this.state.processStatusOptionBuilder}
                selectedOptionFinder={status => status === 'ALL'}
                onChange={selectedValue => this.formValue.processStatus = selectedValue} />
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

  onSimulationIdSelected(selectedSimulationId: SimulationId) {
    this.setState({
      selectedSimulationId
    });
    this.props.onSimulationIdSelected(selectedSimulationId);
    this.formValue.processId = selectedSimulationId.process_id;
    this.formValue.startTime = selectedSimulationId.timestamp;
  }

}
