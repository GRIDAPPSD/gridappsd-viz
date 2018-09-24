import { TimeSeries } from './TimeSeries';

export interface MeasurementGraphModel {
  name: string;
  timeSeries: TimeSeries[];
}