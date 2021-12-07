import { TimeSeriesDataPoint } from './TimeSeriesDataPoint';

/**
 * This type models a time series which is a sequence of points whose x-coordinate is
 * of type date, while y-coordinate is of type number
 */
export interface TimeSeries {
  /**
   * Name of this time series which is used for displaying purpose
   */
  name: string;

  /**
   * The list of data points on this time series line
   */
  points: Array<TimeSeriesDataPoint>;
}
