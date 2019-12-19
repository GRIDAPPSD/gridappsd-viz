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
    <table className='command-event-table'>
      <thead>
        <tr>
          <th className='command-event-table__header'>occuredDateTime</th>
          <th className='command-event-table__header'>stopDateTime</th>
          <th className='command-event-table__header'>forward_differences</th>
          <th className='command-event-table__header'>reverse_differences</th>
        </tr>
      </thead>
      <tbody>
        {
          props.events.map((event, i) => (
            <tr key={i}>
              <td className='command-event-table__cell-value'>
                {dateTimeService.format(event.occuredDateTime)}
              </td>
              <td className='command-event-table__cell-value'>
                {dateTimeService.format(event.stopDateTime)}
              </td>
              <td className='command-event-table__cell-value'>
                {renderDifferences(event.message.forward_differences)}
              </td>
              <td className='command-event-table__cell-value'>
                {renderDifferences(event.message.reverse_differences)}
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}

function renderDifferences(differences: CommandEventDifference[]) {
  return (
    <table className='command-event-table__difference-table'>
      <thead>
        <tr>
          <th className='command-event-table__difference-table__header'>object</th>
          <th className='command-event-table__difference-table__header'>attribute</th>
          <th className='command-event-table__difference-table__header'>value</th>
        </tr>
      </thead>
      <tbody>
        {
          differences.map((difference, index) => (
            <tr key={index}>
              <td className='command-event-table__difference-table__cell-value'>
                {difference.object}
              </td>
              <td className='command-event-table__difference-table__cell-value'>
                {difference.attribute}
              </td>
              <td className='command-event-table__difference-table__cell-value'>
                {difference.value}
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}
