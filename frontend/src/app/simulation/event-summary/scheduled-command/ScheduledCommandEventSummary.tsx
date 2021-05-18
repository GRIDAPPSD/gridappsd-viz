import * as React from 'react';

import { ScheduledCommandEventTable, ScheduledCommandEvent } from '@shared/test-manager';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';

import './ScheduledCommandEventSummary.light.scss';
import './ScheduledCommandEventSummary.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
  onInitialize: (event: ScheduledCommandEvent) => void;
  onClear: (event: ScheduledCommandEvent) => void;
}

export function ScheduledCommandEventSummary(props: Props) {
  return (
    <ScheduledCommandEventTable
      events={props.events}
      actions={event => (
        <>
          <Tooltip
            content='Initiate'
            position='right'>
            <IconButton
              rounded
              icon='cached'
              size='small'
              onClick={() => props.onInitialize(event)} />
          </Tooltip>
          <Tooltip
            content='Clear'
            position='right'>
            <IconButton
              rounded
              icon='close'
              style='accent'
              size='small'
              onClick={() => props.onClear(event)} />
          </Tooltip>
        </>
      )} />
  );
}
