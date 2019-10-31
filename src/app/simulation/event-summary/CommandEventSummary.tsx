import * as React from 'react';

import { CommandEventTable, CommandEvent } from '@shared/test-manager';

import './CommandEventSummary.light.scss';
import './CommandEventSummary.dark.scss';

interface Props {
  events: CommandEvent[];
}

export function CommandEventSummary(props: Props) {
  return (
    <CommandEventTable events={props.events} />
  );
}
