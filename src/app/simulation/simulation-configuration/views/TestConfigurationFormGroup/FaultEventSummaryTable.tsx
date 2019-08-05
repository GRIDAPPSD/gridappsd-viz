import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { FaultEventTable, FaultEvent } from '@shared/test-manager';

import './FaultEventSummaryTable.scss';

interface Props {
  events: FaultEvent[];
  onDeleteEvent: (event: FaultEvent) => void;
}

export function FaultEventSummaryTable(props: Props) {
  return (
    <div className='fault-event-table-wrapper'>
      <FaultEventTable
        events={props.events}
        actions={event => {
          return (
            <Tooltip content='Delete'>
              <IconButton
                icon='delete'
                size='small'
                style='accent'
                onClick={() => props.onDeleteEvent(event)} />
            </Tooltip>
          );
        }} />
    </div>
  );
}
