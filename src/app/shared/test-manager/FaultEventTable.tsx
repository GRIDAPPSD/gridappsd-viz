import * as React from 'react';

import { FaultEvent } from './FaultEvent';

import './FaultEventTable.scss';

interface Props {
  events: FaultEvent[];
  faultMRIDs?: string[];
  actions: (event: FaultEvent) => React.ReactNode;
}

export function FaultEventTable(props: Props) {
  return (
    <table className='fault-event-table'>
      <thead>
        <tr>
          <th>Action</th>
          {
            props.faultMRIDs
            &&
            <th>Fault MRID</th>
          }
          <th>Event Tag</th>
          <th>Equipment Type</th>
          <th>Equipment Name</th>
          <th>Phase</th>
          <th>Fault Kind</th>
          <th>Fault Impedance</th>
          <th>Start Date Time</th>
          <th>Stop Date Time</th>
        </tr>
      </thead>
      <tbody>
        {
          props.events.map((event, i) => (
            <tr key={i}>
              <td>
                <div className='fault-event-table__row-actions'>
                  {props.actions(event)}
                </div>
              </td>
              {
                props.faultMRIDs
                &&
                <td>
                  <div>{props.faultMRIDs[i]}</div>
                </td>
              }
              <td>
                <div>{event.tag}</div>
              </td>
              <td>
                <div>{event.equipmentType}</div>
              </td>
              <td>
                <div>{event.equipmentName}</div>
              </td>
              <td>
                <div>{event.phases.map(phase => phase.phaseLabel).join(', ')}</div>
              </td>
              <td>
                <div>{event.faultKind}</div>
              </td>
              <td>
                {
                  Object.entries(event.FaultImpedance)
                    .filter(entry => entry[1] !== '')
                    .map(entry => <div key={entry[0]}>{`${entry[0]}: ${entry[1]}`}</div>)
                }
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
  );
}