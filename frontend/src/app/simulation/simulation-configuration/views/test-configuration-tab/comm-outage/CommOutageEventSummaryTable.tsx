import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { CommOutageEventTable, CommOutageEvent } from '@shared/test-manager';

import './CommOutageEventSummaryTable.light.scss';
import './CommOutageEventSummaryTable.dark.scss';

interface Props {
  events: CommOutageEvent[];
  onDeleteEvent: (index: number) => void;
}

export function CommOutageEventSummaryTable(props: Props) {
  if (props.events.length === 0) {
    return null;
  }
  return (
    <div className='comm-outage-event-table-wrapper'>
      <CommOutageEventTable
        events={props.events}
        actions={(_, index) => {
          return (
            <Tooltip content='Delete'>
              <IconButton
                rounded
                icon='delete'
                style='accent'
                size='small'
                onClick={() => props.onDeleteEvent(index)} />
            </Tooltip>
          );
        }} />
    </div>
  );
}
