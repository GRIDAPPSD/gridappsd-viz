import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { FaultEventTable, FaultEvent } from '@shared/test-manager';

import './FaultEventSummaryTable.light.scss';
import './FaultEventSummaryTable.dark.scss';

interface Props {
  events: FaultEvent[];
  onDeleteEvent: (index: number) => void;
}

export function FaultEventSummaryTable(props: Props) {
  if (props.events.length === 0) {
    return null;
  }
  return (
    <div className='fault-event-table-wrapper'>
      <FaultEventTable
        events={props.events}
        actions={(_, index) => (
          <Tooltip content='Delete'>
            <IconButton
              icon='delete'
              size='small'
              style='accent'
              onClick={() => props.onDeleteEvent(index)} />
          </Tooltip>
        )} />
    </div>
  );
}
