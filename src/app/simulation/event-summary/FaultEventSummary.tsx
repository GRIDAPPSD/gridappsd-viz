import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { FaultEventTable, FaultEvent } from '@shared/test-manager';

import './FaultEventSummary.light.scss';
import './FaultEventSummary.dark.scss';

interface Props {
  events: FaultEvent[];
  faultMRIDs: string[];
  onInitialize: (event: FaultEvent) => void;
  onClear: (event: FaultEvent) => void;
}

export function FaultEventSummary(props: Props) {
  return (
    <FaultEventTable
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
