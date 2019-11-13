import * as React from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleTime, ScaleTime, ScaleLinear } from 'd3-scale';
import { axisBottom, axisLeft, Axis } from 'd3-axis';
import { line, Line } from 'd3-shape';
import { extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';

import { MeasurementChartModel } from './models/MeasurementChartModel';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';

import './MeasurementChart.light.scss';
import './MeasurementChart.dark.scss';

interface Props {
  measurementChartModel: MeasurementChartModel;
}

interface State {
}

export class MeasurementChart extends React.Component<Props, State> {

  readonly width = 370;
  readonly height = 270;
  readonly margin = {
    top: 20,
    bottom: 35,
    left: 70,
    right: 10
  };
  readonly lineGenerator: Line<TimeSeriesDataPoint>;

  canvas: SVGSVGElement = null;

  private readonly _xScale: ScaleTime<number, number>;
  private readonly _yScale: ScaleLinear<number, number>;
  private readonly _xAxisGenerator: Axis<Date>;
  private readonly _yAxisGenerator: Axis<number>;

  private _container: Selection<SVGElement, any, SVGElement, any>;
  private _xAxis: Selection<SVGElement, any, SVGElement, any>;
  private _yAxis: Selection<SVGGElement, any, SVGElement, any>;

  constructor(props: Props) {
    super(props);

    this._xScale = scaleTime()
      .range([this.margin.left, this.width - this.margin.right]);

    this._yScale = scaleLinear()
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.lineGenerator = line<TimeSeriesDataPoint>()
      .x(dataPoint => this._xScale(dataPoint.unscaledX))
      .y(dataPoint => this._yScale(dataPoint.unscaledY));

    this._xAxisGenerator = axisBottom<Date>(this._xScale)
      .tickFormat(timeFormat('%H:%M:%S'));

    this._yAxisGenerator = axisLeft<number>(this._yScale);
  }

  componentDidMount() {
    this._container = select(this.canvas.querySelector('.measurement-chart__canvas__container') as SVGElement);
    this._xAxis = this._container.select('.x-axis');
    this._yAxis = this._container.select('.y-axis');

    this._render();
  }

  private _render() {
    const axisExtents = this._calculateXYAxisExtents();
    if (axisExtents.y[0] === axisExtents.y[1])
      axisExtents.y[0] = 0;

    this._renderXAxis(axisExtents.x);
    this._renderYAxis(axisExtents.y);
    this._renderTimeSeriesLineCharts();
  }

  private _calculateXYAxisExtents(): { x: [Date, Date], y: [number, number] } {
    const dataPoints: Array<TimeSeriesDataPoint> = this.props.measurementChartModel.timeSeries.reduce(
      (points, series) => {
        points.push(...series.points);
        return points;
      },
      []
    );
    return {
      x: extent<TimeSeriesDataPoint, Date>(dataPoints, point => point.unscaledX),
      y: extent<TimeSeriesDataPoint, number>(dataPoints, point => point.unscaledY)
    };
  }

  private _renderXAxis(xAxisExtent: [Date, Date]) {
    this._xScale.domain(xAxisExtent)
      .range([this.margin.left, this.width - this.margin.right]);
    this._xAxisGenerator.scale(this._xScale);
    this._xAxis.call(this._xAxisGenerator)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.4em')
      .attr('dy', '.45em')
      .attr('transform', 'rotate(-35)');
  }

  private _renderYAxis(updatedYAxisExtent: [number, number]) {
    const currentExtent = this._yScale.domain();
    if (updatedYAxisExtent[0] < currentExtent[0] || updatedYAxisExtent[1] > currentExtent[1]) {
      this._yScale.domain(updatedYAxisExtent);
      this._yAxisGenerator.scale(this._yScale);
      this._yAxis.call(this._yAxisGenerator);
    }
  }

  private _renderTimeSeriesLineCharts() {
    this._container.selectAll('.measurement-chart__canvas__time-series-line')
      .data(this.props.measurementChartModel.timeSeries)
      .join(
        enter => enter.append('path').attr('class', 'measurement-chart__canvas__time-series-line')
      )
      .attr('d', timeSeries => this.lineGenerator(timeSeries.points));
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
          <g className='measurement-chart__canvas__container'>
            <g
              className='measurement-chart__canvas__axis x-axis'
              transform={`translate(0,${this.height - this.margin.bottom})`} />
            <g
              className='measurement-chart__canvas__axis y-axis'
              transform={`translate(${this.margin.left},0)`} />

            {
              this.props.measurementChartModel.yAxisLabel
              &&
              <text
                className='measurement-chart__canvas__axis-label'
                x={this.margin.left / 2}
                y={this.margin.top / 2}
                fontSize='0.8em'
                fontWeight='bold'>
                {this.props.measurementChartModel.yAxisLabel}
              </text>
            }
          </g>
        </svg>
      </div>
    );
  }

}
