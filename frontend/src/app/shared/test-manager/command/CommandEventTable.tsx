import * as React from 'react';

import { DateTimeService } from '@shared/DateTimeService';
import { CommandEvent, CommandEventDifference } from './CommandEvent';

import './CommandEventTable.light.scss';
import './CommandEventTable.dark.scss';

interface Props {
  events: CommandEvent[];
}

const dateTimeService = DateTimeService.getInstance();

export function CommandEventTable(props: Props) {
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

function renderDifferenceTable(differences: CommandEventDifference[]) {
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
