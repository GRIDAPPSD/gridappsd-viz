import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { FormControl, SelectFormControl } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
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

  private _formData: QueryLogsRequestBody = {
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

    this._onSimulationIdSelected = this._onSimulationIdSelected.bind(this);
  }

  render() {
    return (
      <>
        <RequestEditor styles={{ overflow: 'initial', borderRadius: 'initial', boxShadow: 'initial', height: 'initial' }}>
          <form className='query-logs-form'>
            <div className='query-logs-form__left'>
              <FormControl
                label='Start time'
                name='startTime'
                value={this.state.selectedSimulationId ? this.state.selectedSimulationId.timestamp : ''}
                onChange={value => this._formData.startTime = value} />
              <SelectFormControl
                label='Simulation ID'
                menuItems={this.props.simulationIds.map(id => new MenuItem(`${id.process_id}`, id))}
                defaultSelectedIndex={0}
                onChange={this._onSimulationIdSelected} />
              <FormControl
                label='Username'
                name='username'
                value='system'
                onChange={value => this._formData.username = value} />
            </div>
            <div className='query-logs-form__right'>
              <SelectFormControl
                label='Source'
                menuItems={this.props.sources.map(source => new MenuItem(source, source))}
                defaultSelectedIndex={0}
                onChange={menuItem => this._formData.source = menuItem.value} />
              <SelectFormControl
                label='Log level'
                menuItems={
                  ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(e => new MenuItem(e, e))
                }
                defaultSelectedIndex={0}
                onChange={menuItem => this._formData.logLevel = menuItem.value} />
              <SelectFormControl
                label='Process status'
                menuItems={
                  ['ALL', 'STARTING', 'STARTED', 'RUNNING', 'ERROR', 'CLOSED', 'COMPLETE'].map(e => new MenuItem(e, e))
                }
                defaultSelectedIndex={0}
                onChange={menuItem => this._formData.processStatus = menuItem.value} />
            </div>
          </form>
        </RequestEditor>
        <BasicButton
          className='query-logs-form__submit'
          label='Submit'
          type='positive'
          onClick={event => {
            event.stopPropagation();
            this.props.onSubmit(this._formData);
          }} />

      </>
    );
  }

  private _onSimulationIdSelected(menuItem: MenuItem) {
    const simulationId = menuItem.value as SimulationId;
    this.setState({ selectedSimulationId: simulationId });
    this.props.onSimulationIdSelected(simulationId);
    this._formData.processId = simulationId.process_id;
    this._formData.startTime = simulationId.timestamp;
  }

}