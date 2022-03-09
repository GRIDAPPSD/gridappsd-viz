import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlockLayout, useResizeColumns, useTable } from 'react-table';

import { PageChangeEvent, Paginator } from '@client:common/paginator';
import { FormControlModel, Input } from '@client:common/form';
import { fuzzySearch } from '@client:common/misc';
import { Tooltip } from '@client:common/tooltip';

import './FilterableTable.light.scss';
import './FilterableTable.dark.scss';

interface Props<T = Record<string, string | number | boolean>> {
  rows: Array<T>;
  headers?: Array<{ accessor: string; label: string }>;
}

export function FilterableTable(props: Props) {
  const tableElementRef = useRef<HTMLDivElement>(null);
  const tableElement = tableElementRef.current;
  /**
   * Hold the rows that were filtered down by the search box
   */
  const [filteredRows, setFilteredRows] = useState(props.rows);

  /**
   * Hold the rows in the current page created by the paginator
   */
  const [currentPage, setCurrentPage] = useState(props.rows);
  const columns = useMemo(() => {
    if (!props.headers) {
      if (props.rows.length > 0) {
        const keys = Object.keys(props.rows[0]);
        return keys.map(columnName => ({
          accessor: columnName,
          Header: columnName,
          width: tableElement ? tableElement.clientWidth / keys.length : 120
        }));
      }
      return [];
    }
    return props.headers.map(header => ({
      accessor: header.accessor,
      Header: header.label
    }));
  }, [props.rows, props.headers, tableElement]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: currentPage
    },
    useBlockLayout,
    useResizeColumns
  );
  const searchBoxFormControlRef = useRef(new FormControlModel(''));
  const onCurrentPageChange = (event: PageChangeEvent<any>) => {
    setCurrentPage(event.currentPage);
  };

  useEffect(() => {
    const subscription = searchBoxFormControlRef.current.valueChanges()
      .subscribe({
        next: keyword => {
          if (keyword === '') {
            setFilteredRows(props.rows);
          } else {
            const matchFinder = fuzzySearch(keyword);
            const searchResults = props.rows.map(row => {
              const match = Object.values(row)
                .map(value => matchFinder(String(value)))
                .filter(result => result !== null)
                .reduce((a, b) => a === null ? b : (a.inaccuracy < b.inaccuracy ? a : b), null);
              return {
                row,
                inaccuracy: match !== null ? match.inaccuracy : Infinity
              };
            });
            const foundRows = searchResults
              .filter(e => e.inaccuracy !== Infinity)
              .sort((a, b) => a.inaccuracy < b.inaccuracy ? -1 : 1)
              .map(e => e.row);
            setFilteredRows(foundRows);
          }
        }
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [props.rows]);

  if (props.rows.length === 0) {
    return null;
  }

  return (
    <div
      ref={tableElementRef}
      className='filterable-table'
      {...getTableProps()}>
      <div className='thead'>
        {
          headerGroups.map(headerGroup => (
            <div
              key={headerGroup.id}
              className='tr'
              {...headerGroup.getHeaderGroupProps()}>
              {
                headerGroup.headers.map(column => (
                  <div
                    key={column.id}
                    className='th'
                    {...column.getHeaderProps()}>
                    {column.render('Header')}
                    <div
                      className='resizer'
                      {...column['getResizerProps']()} />
                  </div>
                ))
              }
            </div>
          ))
        }
      </div>

      <div
        className='tbody'
        {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <div
              key={row.id}
              className='tr'
              {...row.getRowProps()}>
              {row.cells.map((cell, i) => {
                const cellValue = String(cell.value);
                if (cellValue.length > 0) {
                  return (
                    <Tooltip
                      key={i}
                      content={cell.value}>
                      <div
                        className='td'
                        {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </div>
                    </Tooltip>
                  );
                }
                return (
                  <div
                    key={i}
                    className='td'
                    {...cell.getCellProps()}>
                    {cell.render('Cell')}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className='tfoot'>
        <Input
          label='Search'
          type='text'
          className='filterable-table__search-box'
          formControlModel={searchBoxFormControlRef.current} />
        <Paginator
          items={filteredRows}
          onPageChange={onCurrentPageChange} />
      </div>
    </div>
  );
}
