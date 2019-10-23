import * as React from 'react';

import { CommandEventTable, CommandEvent } from '@shared/test-manager';

import './CommandEventSummary.scss';

interface Props {
  events: CommandEvent[];
}

export function CommandEventSummary(props: Props) {
  return (
    <CommandEventTable events={props.events} />
  );
}
