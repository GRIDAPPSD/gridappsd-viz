import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { CommOutageEventTable, CommOutageEvent } from '@shared/test-manager';

import './CommOutageEventSummaryTable.scss';

interface Props {
  events: CommOutageEvent[];
  onDeleteEvent: (event: CommOutageEvent) => void;
}

export function CommOutageEventSummaryTable(props: Props) {
  return (
    <div className='comm-outage-event-table-wrapper'>
      <CommOutageEventTable
        events={props.events}
        actions={event => {
          return (
            <Tooltip content='Delete'>
              <IconButton
                rounded
                icon='delete'
                style='accent'
                size='small'
                onClick={() => props.onDeleteEvent(event)} />
            </Tooltip>
          );
        }} />
    </div>
  );
}
