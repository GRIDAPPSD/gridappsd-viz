export interface CommandEvent {
  event_type: 'ScheduledCommandEvent';
  message: {
    forward_differences: CommandEventDifference[];
    reverse_differences: CommandEventDifference[];
  };
  occuredDateTime: number;
  stopDateTime: number;
}

export interface CommandEventDifference {
  object: string;
  attribute: string;
  value: string;
}
