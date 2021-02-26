import * as React from 'react';

import { ScheduledCommandEventTable, ScheduledCommandEvent } from '@shared/test-manager';

import './ScheduledCommandEventSummary.light.scss';
import './ScheduledCommandEventSummary.dark.scss';

interface Props {
  events: ScheduledCommandEvent[];
}

export function ScheduledCommandEventSummary(props: Props) {
  return (
    <ScheduledCommandEventTable events={props.events} />
  );
}
