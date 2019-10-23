import * as React from 'react';

import { CommandEvent, CommandEventTable } from '@shared/test-manager';

import './CommandEventSummaryTable.scss';

interface Props {
  events: CommandEvent[];
}

export function CommandEventSummaryTable(props: Props) {
  return (
    <div className='command-event-summary-table'>
      <CommandEventTable events={props.events} />
    </div>
  );
}
