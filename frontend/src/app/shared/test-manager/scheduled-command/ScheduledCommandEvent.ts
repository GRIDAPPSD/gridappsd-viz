/* eslint-disable camelcase */
export interface ScheduledCommandEvent {
  event_type: 'ScheduledCommandEvent';
  message: {
    forward_differences: ScheduledCommandEventDifference[];
    reverse_differences: ScheduledCommandEventDifference[];
  };
  occuredDateTime: number | string;
  stopDateTime: number | string;
}

export interface ScheduledCommandEventDifference {
  object: string;
  attribute: string;
  value: string;
}
