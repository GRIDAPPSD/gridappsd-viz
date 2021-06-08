import { Phase } from '../Phase';

export interface ScheduledCommandEvent {
  tag: string;
  eventType: 'ScheduledCommandEvent';
  componentName: string | string[];
  mRID: string | string[];
  phases: Phase[];
  attribute: string;
  forwardDifferenceValue: number;
  reverseDifferenceValue: number;
  // Epoch time with second precision
  startDateTime: number;
  stopDateTime: number;
}
