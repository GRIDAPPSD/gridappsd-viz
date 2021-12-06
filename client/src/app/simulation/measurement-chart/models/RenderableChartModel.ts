import { TimeSeries } from './TimeSeries';

/**
 * Encapsulates the details for a chart that can be rendered onto the screen.
 * A chart can contain multiple time series lines, objects of this shape makes
 * it easy to encode that information
 */
export interface RenderableChartModel {
  /**
   * The name of this chart, used for displaying purpose
   */
  name: string;

  /**
   * The list of time series lines that exist in this chart
   */
  timeSeries: TimeSeries[];

  /**
   * The label used to denote the kind of value on the y-axis
   */
  yAxisLabel: string;
}
