import * as React from 'react';

import { CommandEvent, CommandEventTable } from '@shared/test-manager';

import './CommandEventSummaryTable.light.scss';
import './CommandEventSummaryTable.dark.scss';

interface Props {
  events: CommandEvent[];
}

export function CommandEventSummaryTable(props: Props) {
  if (props.events.length === 0)
    return null;
  return (
    <div className='command-event-summary-table'>
      <CommandEventTable events={props.events} />
    </div>
  );
}
