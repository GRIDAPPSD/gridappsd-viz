import * as React from 'react';
import ReactTable from 'react-table';

import { Tooltip } from '@shared/tooltip';

import './QueryLogsResultTable.scss';
import 'react-table/react-table.css';


interface Props {
  rows: any;
}

interface State {
}

export class QueryLogsResultTable extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <ReactTable
        filterable={true}
        defaultFilterMethod={(filter, row) => {
          return row[filter.id] !== undefined ? String(row[filter.id]).includes(filter.value.toLowerCase()) : true;
        }}
        defaultPageSize={5}
        data={this.props.rows}
        columns={
          Object.keys(this.props.rows[0] || {})
            .map(columnName => ({
              accessor: columnName,
              Header: columnName,
              Cell: row => (
                row.value.length > 15
                  ?
                  <Tooltip position='bottom'
                    content={row.value}>
                    <span style={{
                      display: 'inline-block',
                      width: '100%',
                      position: 'relative',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
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
        className='query-logs-result-table' />
    );
  }

}
