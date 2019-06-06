import * as React from 'react';

import { OutageEvent } from '../../models/OutageEvent';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';

import './OutageEventSummaryTable.scss';

interface Props {
  events: OutageEvent[];
  onDeleteEvent: (event: OutageEvent) => void;
}

export function OutageEventSummaryTable(props: Props) {
  return (
    <div className='outage-event-summary-table-wrapper'>
      <table className='outage-event-summary-table'>
        <thead>
          <tr>
            <th rowSpan={2}>Action</th>
            <th rowSpan={2}>Event ID</th>
            <th colSpan={4}>Input List</th>
            <th colSpan={6}>Output List</th>
          </tr>
          <tr>
            {/* Input List*/}
            <th>Equipment Type</th>
            <th>Equipment Name</th>
            <th>Phase</th>
            <th>Attribute</th>
            {/* Output List*/}
            <th>Equipment Type</th>
            <th>Name</th>
            <th>Phases</th>
            <th>Measurement Type</th>
            <th>Start Date Time</th>
            <th>Stop Date Time</th>
          </tr>
        </thead>
        <tbody>
          {
            props.events.map((event, i) => (
              <tr key={i}>
                <td>
                  <div className='outage-event-summary-table__row-action'>
                    <Tooltip content='Delete'>
                      <IconButton
                        rounded
                        icon='delete'
                        style='accent'
                        size='small'
                        onClick={() => props.onDeleteEvent(event)} />
                    </Tooltip>
                  </div>
                </td>
                <td>
                  <div>{event.id}</div>
                </td>
                {/* Input List */}
                <td>
                  {event.inputList.map((e, i) => <div key={i}>{e.type}</div>)}
                </td>
                <td>
                  {event.inputList.map((e, i) => <div key={i}>{e.name}</div>)}
                </td>
                <td>
                  {event.inputList.map((e, i) => <div key={i}>{e.phases.map(e => e.phaseLabel).join(', ')}</div>)}
                </td>
                <td>
                  {event.inputList.map((e, i) => <div key={i}>{e.attribute}</div>)}
                </td>
                {/* Output List */}
                <td>
                  {event.outputList.map((e, i) => <div key={i}>{e.type}</div>)}
                </td>
                <td>
                  {event.outputList.map((e, i) => <div key={i}>{e.name}</div>)}
                </td>
                <td>
                  {event.outputList.map((e, i) => <div key={i}>{e.phases.join(', ')}</div>)}
                </td>
                <td>
                  {event.outputList.map((e, i) => <div key={i}>{e.measurementTypes.join(', ')}</div>)}
                </td>
                <td>
                  <div>{event.startDateTime}</div>
                </td>
                <td>
                  <div>{event.stopDateTime}</div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}