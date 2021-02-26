import * as React from 'react';

import { ScheduledCommandEvent, ScheduledCommandEventTable } from '@shared/test-manager';

import './ScheduledCommandEventSummaryTable.light.scss';
import './ScheduledCommandEventSummaryTable.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
}

export function ScheduledCommandEventSummaryTable(props: Props) {
  if (props.events.length === 0) {
    return null;
  }
  return (
    <div className='command-event-summary-table'>
      <ScheduledCommandEventTable events={props.events} />
    </div>
  );
}
