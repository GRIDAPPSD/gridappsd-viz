/**
 * Represents a single data point on a time series line
 */
export interface TimeSeriesDataPoint {
  /**
   * The x-coordinate of this data point
   */
  timestamp: Date;

  /**
   * The y-coordinate of this data point
   */
  measurement: number;
}
