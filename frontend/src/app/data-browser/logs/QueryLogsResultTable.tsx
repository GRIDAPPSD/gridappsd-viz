import * as React from 'react';
import ReactTable from 'react-table';

import { Tooltip } from '@shared/tooltip';

import './QueryLogsResultTable.light.scss';
import './QueryLogsResultTable.dark.scss';

interface Props {
  rows: any[];
}

export function QueryLogsResultTable(props: Props) {
  return (
    <ReactTable
      filterable={true}
      defaultFilterMethod={(filter, row) => {
        return row[filter.id] !== undefined ? String(row[filter.id]).includes(filter.value.toLowerCase()) : true;
      }}
      defaultPageSize={5}
      data={props.rows}
      columns={
        Object.keys(props.rows[0])
          .map(columnName => ({
            accessor: columnName,
            Header: columnName,
            Cell: row => (
              row.value.length > 15
                ?
                <Tooltip content={row.value}>
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
