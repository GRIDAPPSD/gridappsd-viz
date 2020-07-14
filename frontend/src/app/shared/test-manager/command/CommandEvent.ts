/* eslint-disable camelcase */
export interface CommandEvent {
  event_type: 'ScheduledCommandEvent';
  message: {
    forward_differences: CommandEventDifference[];
    reverse_differences: CommandEventDifference[];
  };
  occuredDateTime: number | string;
  stopDateTime: number | string;
}

export interface CommandEventDifference {
  object: string;
  attribute: string;
  value: string;
}
