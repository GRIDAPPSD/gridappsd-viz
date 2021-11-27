export interface TimeSeries {
  name: string;
  points: Array<TimeSeriesDataPoint>;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  measurement: number;
}
