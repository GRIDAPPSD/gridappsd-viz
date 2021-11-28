
import { DateTimeService } from '@client:common/DateTimeService';

import { ScheduledCommandEvent } from './ScheduledCommandEvent';

import './ScheduledCommandEvent.light.scss';
import './ScheduledCommandEvent.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
  actions: (event: ScheduledCommandEvent, index: number) => React.ReactNode;
}

const dateTimeService = DateTimeService.getInstance();

export function ScheduledCommandEventTable(props: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Component name</th>
          <th>Attribute</th>
          <th>Reverse difference value</th>
          <th>Forward difference value</th>
          <th>Start date time</th>
          <th>Stop date time</th>
        </tr>
      </thead>
      <tbody>
        {
          props.events.map((event, i) => (
            <tr key={i}>
              <td>
                <div className='scheduled-command-event-table__row-actions'>
                  {props.actions(event, i)}
                </div>
              </td>
              <td>
                <div>
                  {event.componentName}
                </div>
              </td>
              <td>
                <div>
                  {event.attribute}
                </div>
              </td>
              <td>
                <div>
                  {event.reverseDifferenceValue}
                </div>
              </td>
              <td>
                <div>
                  {event.forwardDifferenceValue}
                </div>
              </td>
              <td>
                <div>
                  {dateTimeService.format(event.startDateTime)}
                </div>
              </td>
              <td>
                <div>
                  {dateTimeService.format(event.stopDateTime)}
                </div>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
