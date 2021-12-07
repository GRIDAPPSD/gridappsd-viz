import { TimeSeries } from './TimeSeries';

export interface LineChartModel {
  name: string;
  timeSeries: TimeSeries[];
  yAxisLabel: string;
}
