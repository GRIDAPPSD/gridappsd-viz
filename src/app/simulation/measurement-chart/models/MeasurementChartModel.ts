import { TimeSeries } from './TimeSeries';

export interface MeasurementChartModel {
  name: string;
  timeSeries: TimeSeries[];
}
