
import { DateTimeService } from '@client:common/DateTimeService';

import { CommOutageEvent } from './CommOutageEvent';

import './CommOutageEventTable.light.scss';
import './CommOutageEventTable.dark.scss';

interface Props {
  events: CommOutageEvent[];
  faultMRIDs?: string[];
  actions: (event: CommOutageEvent, index: number) => React.ReactNode;
}

const dateTimeService = DateTimeService.getInstance();

export function CommOutageEventTable(props: Props) {
  return (
    <table className='comm-outage-event-table'>
      <thead>
        <tr>
          <th rowSpan={2}>Action</th>
          {
            props.faultMRIDs
            &&
            <th rowSpan={2}>Fault MRID</th>
          }
          <th rowSpan={2}>Event Tag</th>
          <th colSpan={5}>Input List</th>
          <th colSpan={5}>Output List</th>
          <th rowSpan={2}>Start Date Time</th>
          <th rowSpan={2}>Stop Date Time</th>
        </tr>
        <tr>
          {/* Input List*/}
          <th className='comm-outage-event-table__secondary-heading'>All Input Outage</th>
          <th className='comm-outage-event-table__secondary-heading'>Equipment Type</th>
          <th className='comm-outage-event-table__secondary-heading'>Equipment Name</th>
          <th className='comm-outage-event-table__secondary-heading'>Phase</th>
          <th className='comm-outage-event-table__secondary-heading'>Attribute</th>
          {/* Output List*/}
          <th className='comm-outage-event-table__secondary-heading'>All Output Outage</th>
          <th className='comm-outage-event-table__secondary-heading'>Equipment Type</th>
          <th className='comm-outage-event-table__secondary-heading'>Name</th>
          <th className='comm-outage-event-table__secondary-heading'>Phases</th>
          <th className='comm-outage-event-table__secondary-heading'>Measurement Type</th>
        </tr>
      </thead>
      <tbody>
        {
          props.events.map((event, index) => (
            <tr key={event.tag}>
              <td>
                <div className='comm-outage-event-table__row-actions'>
                  {props.actions(event, index)}
                </div>
              </td>
              {
                props.faultMRIDs &&
                <td>
                  <div>{props.faultMRIDs[index]}</div>
                </td>
              }
              <td>
                <div>{event.tag}</div>
              </td>
              {/* Input List */}
              <td>
                <div>{event.allInputOutage ? '✓' : ''}</div>
              </td>
              <td>
                {event.inputList.map((e, i) => <div key={i}>{e.type}</div>)}
              </td>
              <td>
                {event.inputList.map((e, i) => <div key={i}>{e.name}</div>)}
              </td>
              <td>
                {event.inputList.map((inputItem, i) => <div key={i}>{inputItem.phases.map(e => e.phaseLabel).join(', ')}</div>)}
              </td>
              <td>
                {event.inputList.map((e, i) => <div key={i}>{e.attribute}</div>)}
              </td>
              {/* Output List */}
              <td>
                <div>{event.allOutputOutage ? '✓' : ''}</div>
              </td>
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
                <div>{dateTimeService.format(event.startDateTime)}</div>
              </td>
              <td>
                <div>{dateTimeService.format(event.stopDateTime)}</div>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
