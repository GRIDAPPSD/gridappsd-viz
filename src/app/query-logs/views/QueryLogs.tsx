import * as React from 'react';
import ReactTable from 'react-table';

import { Dialog } from '../../shared/views/dialog/Dialog';
import { DialogContent } from '../../shared/views/dialog/DialogContent';
import { DialogActions } from '../../shared/views/dialog/DialogActions';
import { BasicButton } from '../../shared/views/buttons/basic-button/BasicButton';
import { FormControl } from '../../shared/views/form/form-control/FormControl';
import { MenuItem } from '../../shared/views/dropdown-menu/MenuItem';
import { SelectFormControl } from '../../shared/views/form/select-form-control/SelectFormControl';
import { SimulationId } from '../models/SimulationId';
import { QueryLogsRequestBody } from '../models/QueryLogsRequestBody';

import './QueryLogs.scss';
import 'react-table/react-table.css';

interface Props {
  onSubmit: (body: QueryLogsRequestBody) => void;
  onClose: (event) => void;
  onSimulationIdSelected: (simulationId: SimulationId) => void;
  simulationIds: SimulationId[];
  sources: string[];
  result: any[];
}

interface State {
  show: boolean;
  selectedSimulationId: SimulationId;
}

export class QueryLogs extends React.Component<Props, State> {

  private _formData: QueryLogsRequestBody = {
    startTime: '',
    processId: '',
    username: 'system',
    source: '',
    processStatus: 'ALL',
    logLevel: 'DEBUG'
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
      <Dialog show={this.state.show}>
        <DialogContent>
          <div className='query-logs'>
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
                    ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(e => new MenuItem(e, e))
                  }
                  defaultSelectedIndex={1}
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
            <ReactTable
              filterable={true}
              defaultFilterMethod={(filter, row, column) => {
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
                      <span title={row.original[row.column.Header]}>
                        {row.original[row.column.Header]}
                      </span>
                    ),
                    style: {
                      textAlign: 'center'
                    }
                  }))
              }
              className='query-logs-result' />

          </div>
        </DialogContent>
        <DialogActions>
          <BasicButton
            label='Cancel'
            type='negative'
            onClick={event => {
              event.stopPropagation();
              this.setState({ show: false });
              this.props.onClose(event);
            }} />
          <BasicButton
            label='Submit'
            type='positive'
            onClick={event => {
              event.stopPropagation();
              this.props.onSubmit(this._formData);
            }} />
        </DialogActions>
      </Dialog>
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