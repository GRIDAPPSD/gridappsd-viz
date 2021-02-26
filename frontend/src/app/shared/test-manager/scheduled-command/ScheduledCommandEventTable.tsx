import * as React from 'react';

import { DateTimeService } from '@shared/DateTimeService';
import { ScheduledCommandEvent, ScheduledCommandEventDifference } from './ScheduledCommandEvent';

import './ScheduledCommandEvent.light.scss';
import './ScheduledCommandEvent.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
}

const dateTimeService = DateTimeService.getInstance();

export function ScheduledCommandEventTable(props: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>occuredDateTime</th>
          <th>stopDateTime</th>
          <th>forward_differences</th>
          <th>reverse_differences</th>
        </tr>
      </thead>
      <tbody>
        {
          props.events.map((event, i) => (
            <tr key={i}>
              <td>
                <div>
                  {dateTimeService.format(event.occuredDateTime)}
                </div>
              </td>
              <td>
                <div>
                  {dateTimeService.format(event.stopDateTime)}
                </div>
              </td>
              <td>
                {renderDifferenceTable(event.message.forward_differences)}
              </td>
              <td>
                {renderDifferenceTable(event.message.reverse_differences)}
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}

function renderDifferenceTable(differences: ScheduledCommandEventDifference[]) {
  return (
    <table>
      <thead>
        <tr>
          <th>object</th>
          <th>attribute</th>
          <th>value</th>
        </tr>
      </thead>
      <tbody>
        {
          differences.map((difference, index) => (
            <tr key={index}>
              <td>
                <div>
                  {difference.object}
                </div>
              </td>
              <td>
                <div>
                  {difference.attribute}
                </div>
              </td>
              <td>
                <div>
                  {difference.value}
                </div>
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
