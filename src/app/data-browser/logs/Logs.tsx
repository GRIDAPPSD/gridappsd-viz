import * as React from 'react';
import ReactTable from 'react-table';

import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';
import { FormControl, SelectFormControl } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
import { Tooltip } from '@shared/tooltip';
import { BasicButton } from '@shared/buttons';
import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';

import './Logs.scss';
import 'react-table/react-table.css';

interface Props {
  onSubmit: (body: QueryLogsRequestBody) => void;
  onSimulationIdSelected: (simulationId: SimulationId) => void;
  simulationIds: SimulationId[];
  sources: string[];
  result: any[];
}

interface State {
  show: boolean;
  selectedSimulationId: SimulationId;
}

export class Logs extends React.Component<Props, State> {

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
      show: true,
      selectedSimulationId: null
    };

    this._onSimulationIdSelected = this._onSimulationIdSelected.bind(this);
  }

  render() {
    return (
      <div className='query-logs'>
        <RequestEditor styles={{ overflow: 'initial', borderRadius: 'initial', boxShadow: 'initial', height: 'initial' }}>
          <form className='query-logs__request-configuration'>
            <div className='query-logs__request-configuration__left'>
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
            <div className='query-logs__request-configuration__right'>
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
          label='Submit'
          type='positive'
          onClick={event => {
            event.stopPropagation();
            this.props.onSubmit(this._formData);
          }} />
        <Response styles={{ boxShadow: 'initial', borderRadius: '0', height: '60vh', maxHeight: '60vh', overflow: 'initial' }}>
          <ReactTable
            filterable={true}
            defaultFilterMethod={(filter, row) => {
              return row[filter.id] !== undefined ? String(row[filter.id]).includes(filter.value.toLowerCase()) : true
            }}
            defaultPageSize={5}
            data={this.props.result}
            columns={
              Object.keys(this.props.result[0] || {})
                .map(columnName => ({
                  accessor: columnName,
                  Header: columnName,
                  Cell: row => (
                    row.value.length > 15 ?
                      <Tooltip position='bottom'
                        content={row.value}>
                        <span style={{
                          display: 'inline-block',
                          width: '100%',
                          position: 'relative',
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}>
                          {row.value}
                        </span>
                      </Tooltip>
                      :
                      <span style={{
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        textAlign: 'center'
                      }}>
                        {row.value}
                      </span>
                  )
                }))
            }
            className='query-logs__result' />
        </Response>
      </div>
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