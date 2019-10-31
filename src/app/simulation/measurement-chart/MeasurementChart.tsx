import * as React from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleTime, ScaleTime, ScaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { line, Line } from 'd3-shape';
import { extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';

import { MeasurementChartModel } from './models/MeasurementChartModel';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { TimeSeries } from './models/TimeSeries';

import './MeasurementChart.light.scss';
import './MeasurementChart.dark.scss';

interface Props {
  measurementChartModel: MeasurementChartModel;
}

interface State {
}

export class MeasurementChart extends React.Component<Props, State> {

  readonly height = 270;

  canvas: SVGSVGElement = null;
  width = 370;

  private _container: Selection<SVGGElement, any, any, any> = null;
  private _timeScale: ScaleTime<number, number> = null;
  private _yScale: ScaleLinear<number, number> = null;
  private _lineGenerator: Line<TimeSeriesDataPoint> = null;
  private readonly _margin = { top: 20, bottom: 35, left: 70, right: 10 };

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    this._init();
    this._render();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.measurementChartModel !== this.props.measurementChartModel)
      this._render();
  }

  render() {
    return (
      <div className='measurement-chart'>
        <header className='measurement-chart__name'>
          {this.props.measurementChartModel.name}
        </header>
        <div className='measurement-chart__legends'>
          {
            this.props.measurementChartModel.timeSeries.map(timeSeries => (
              <div
                key={timeSeries.name}
                className='measurement-chart__legend'>
                <div className='measurement-chart__legend__color' />
                <div className='measurement-chart__legend__label'>
                  {timeSeries.name}
                </div>
              </div>
            ))
          }
        </div>
        <svg
          className='measurement-chart__canvas'
          ref={elem => this.canvas = elem}
          width={this.width}
          height={this.height}
          viewBox={`0 0 ${this.width} ${this.height}`}
          preserveAspectRatio='xMidYMin meet'>
          <g />
        </svg>
      </div>
    );
  }

  private _init() {
    this._container = select(this.canvas).select('g');
    this._timeScale = scaleTime()
      .range([this._margin.left, this.width - this._margin.right]);
    this._yScale = scaleLinear()
      .range([this.height - this._margin.bottom, this._margin.top]);
    this._lineGenerator = line<TimeSeriesDataPoint>()
      .x(dataPoint => this._timeScale(dataPoint.primitiveX))
      .y(dataPoint => this._yScale(dataPoint.primitiveY));
  }

  private _render() {
    this._container.selectAll('*').remove();

    const axisExtents = this._calculateXYAxisExtents(this.props.measurementChartModel.timeSeries);
    if (axisExtents.yExtent[0] === axisExtents.yExtent[1])
      axisExtents.yExtent[0] = 0;
    this._timeScale.domain(axisExtents.xExtent);
    this._yScale.domain(axisExtents.yExtent);

    this._renderYAxisLabel();
    this._renderXAxis();
    this._renderYAxis();
    this._renderTimeSeriesLineCharts();
  }

  private _calculateXYAxisExtents(timeSeries: TimeSeries[]): { xExtent: [Date, Date], yExtent: [number, number] } {
    const dataPoints: Array<TimeSeriesDataPoint> = timeSeries.reduce((points, series) => points.concat(series.points), []);
    return {
      xExtent: extent<TimeSeriesDataPoint, Date>(dataPoints, point => point.primitiveX),
      yExtent: extent<TimeSeriesDataPoint, number>(dataPoints, point => point.primitiveY)
    };
  }

  private _renderYAxisLabel() {
    const yAxisLabel = this.props.measurementChartModel.yAxisLabel;
    if (yAxisLabel)
      this._container.append('text')
        .attr('class', 'measurement-chart__canvas__axis-label')
        .text(yAxisLabel)
        .attr('x', this._margin.left / 2)
        .attr('y', this._margin.top / 2)
        .attr('font-size', '0.8em')
        .attr('font-weight', 'bold');
  }

  private _renderXAxis() {
    this._container.append('g')
      .attr('class', 'axis x')
      .attr('transform', `translate(0,${this.height - this._margin.bottom})`)
      .call(axisBottom(this._timeScale).tickFormat(timeFormat('%H:%M:%S')))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.4em')
      .attr('dy', '.45em')
      .attr('transform', 'rotate(-35)');
  }

  private _renderYAxis() {
    this._container.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${this._margin.left},0)`)
      .call(axisLeft(this._yScale));
  }

  private _renderTimeSeriesLineCharts() {
    for (const timeSeries of this.props.measurementChartModel.timeSeries) {
      this._container.append('path')
        .attr('class', 'time-series-line')
        .datum(timeSeries.points)
        .attr('d', this._lineGenerator);
    }
  }

}
