import { TimeSeries } from './TimeSeries';

export interface RenderableChartModel {
  name: string;
  timeSeries: TimeSeries[];
  yAxisLabel: string;
}
