import { ScheduledCommandEvent, ScheduledCommandEventTable } from '@client:common/test-manager';
import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';

import './ScheduledCommandEventSummaryTable.light.scss';
import './ScheduledCommandEventSummaryTable.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
  onDeleteEvent: (index: number) => void;
}

export function ScheduledCommandEventSummaryTable(props: Props) {
  if (props.events.length === 0) {
    return null;
  }
  return (
    <div className='command-event-summary-table'>
      <ScheduledCommandEventTable
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
