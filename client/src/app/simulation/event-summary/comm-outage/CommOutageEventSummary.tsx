import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { CommOutageEventTable, CommOutageEvent } from '@shared/test-manager';

import './CommOutageEventSummary.light.scss';
import './CommOutageEventSummary.dark.scss';

interface Props {
  events: CommOutageEvent[];
  faultMRIDs: string[];
  onInitialize: (event: CommOutageEvent) => void;
  onClear: (event: CommOutageEvent) => void;
}

export function CommOutageEventSummary(props: Props) {
  return (
    <CommOutageEventTable
      events={props.events}
      faultMRIDs={props.faultMRIDs}
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
