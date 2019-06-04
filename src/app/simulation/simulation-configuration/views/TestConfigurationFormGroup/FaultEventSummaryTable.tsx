import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { FaultEvent } from '../../models/FaultEvent';

import './FaultEventSummaryTable.scss';

interface Props {
  events: FaultEvent[];
  onDeleteEvent: (event: FaultEvent) => void;
}

export function FaultEventSummaryTable(props: Props) {
  return (
    <div className='fault-event-summary-table-wrapper'>
      <table className='fault-event-summary-table'>
        <thead>
          <tr>
            <th>Action</th>
            <th>Event ID</th>
            <th>Equipment Type</th>
            <th>Equipment Name</th>
            <th>Phase</th>
            <th>Fault Kind</th>
            <th>Value</th>
            <th>Impedance</th>
            <th>Value</th>
            <th>Start Date Time</th>
            <th>Stop Date Time</th>
          </tr>
        </thead>
        <tbody>
          {
            props.events.map((event, i) => (
              <tr key={i}>
                <td>
                  <div className='fault-event-summary-table__row-action'>
                    <Tooltip content='Delete'>
                      <IconButton
                        icon='delete'
                        size='small'
                        style='accent'
                        onClick={() => props.onDeleteEvent(event)} />
                    </Tooltip>
                  </div>
                </td>
                <td>
                  <div>{event.id}</div>
                </td>
                {/* Input List */}
                <td>
                  {event.equipmentType}
                </td>
                <td><div>{event.equipmentName}</div></td>
                <td><div>{event.phase}</div></td>
                <td><div>{event.faultKind}</div></td>
                <td><div>{event.lineToGround || event.lineToLine || event.lineToLineToGround}</div></td>
                <td><div>{event.faultKind}</div></td>
                <td>
                  {
                    Object.entries(event.impedance)
                      .filter(entry => entry[1] !== '')
                      .map(entry => (
                        <div key={entry[0]}><div>{`${entry[0]}: ${entry[1]}`}</div></div>
                      ))
                  }
                </td>
                <td><div>{event.startDateTime}</div></td>
                <td><div>{event.stopDateTime}</div></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}