export interface ScheduledCommandEvent {
  tag: string;
  eventType: 'ScheduledCommandEvent';
  componentName: string;
  mRID: string | string[];
  attribute: string;
  forwardDifferenceValue: number;
  reverseDifferenceValue: number;
  // Epoch time with second precision
  startDateTime: number;
  stopDateTime: number;
}
