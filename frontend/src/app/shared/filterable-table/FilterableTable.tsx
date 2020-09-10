import * as React from 'react';
import ReactTable, { Filter } from 'react-table';

import { Tooltip } from '@shared/tooltip';

import './FilterableTable.light.scss';
import './FilterableTable.dark.scss';
import { MessageBanner } from '@shared/overlay/message-banner';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  headers?: Array<{ accessor: string; label: string }>;
}

interface State {
}

export class FilterableTable extends React.Component<Props, State> {

  private readonly _cellContentWidthCalculator = document.createElement('div');

  constructor(props: Props) {
    super(props);

    this._cellContentWidthCalculator.classList.add('filterable-table__cell-content-width-calculator');
    document.body.appendChild(this._cellContentWidthCalculator);

    this._createTableCell = this._createTableCell.bind(this);
  }

  componentWillUnmount() {
    document.body.removeChild(this._cellContentWidthCalculator);
  }

  render() {
    if (this.props.rows.length === 0) {
      return (
        <MessageBanner>
          No data available
        </MessageBanner>
      );
    }
    return (
      <ReactTable
        filterable
        className='filterable-table'
        defaultFilterMethod={this.filterMethod}
        defaultPageSize={5}
        data={this.props.rows}
        columns={this.generateColumns()} />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterMethod(filter: Filter, row: any) {
    if (row[filter.id] !== undefined) {
      return String(row[filter.id]).toLowerCase().includes(filter.value.toLowerCase());
    }
    return true;
  }

  generateColumns() {
    if (!this.props.headers) {
      return Object.keys(this.props.rows[0])
        .map(columnName => ({
          accessor: columnName,
          Header: columnName,
          Cell: this._createTableCell
        }));
    }
    return this.props.headers.map(header => ({
      accessor: header.accessor,
      Header: header.label,
      Cell: this._createTableCell
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _createTableCell(row: any) {
    if (this._isRowOverflowing(row)) {
      return (
        <Tooltip content={row.value}>
          <span className='filterable-table__cell-content overflowing'>
            <div>
              {String(row.value)}
            </div>
          </span>
        </Tooltip>
      );
    }
    return (
      <span className='filterable-table__cell-content'>
        {String(row.value)}
      </span>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _isRowOverflowing(row: any) {
    this._cellContentWidthCalculator.textContent = row.value;
    return this._cellContentWidthCalculator.scrollWidth > row.width;
  }

}
