import { TimeSeriesDataPoint } from './TimeSeriesDataPoint';

export interface TimeSeries {
  name: string;
  points: Array<TimeSeriesDataPoint>
}