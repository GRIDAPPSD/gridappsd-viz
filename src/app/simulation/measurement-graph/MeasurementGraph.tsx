import * as React from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleTime, ScaleTime, ScaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { line, Line } from 'd3-shape';
import { extent } from 'd3-array';
import { timeSecond } from 'd3-time';

import { MeasurementGraphModel } from './models/MeasurementGraphModel';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { TimeSeries } from './models/TimeSeries';

import './MeasurementGraph.scss';

interface Props {
  measurementGraphModel: MeasurementGraphModel;
}

interface State {
}

export class MeasurementGraph extends React.Component<Props, State> {

  private _canvas: SVGSVGElement = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _timeScale: ScaleTime<number, number> = null;
  private _yScale: ScaleLinear<number, number> = null;
  private _lineGenerator: Line<TimeSeriesDataPoint> = null;
  private readonly _margin = { top: 10, bottom: 20, left: 70, right: 10 };
  private _width = 370;
  private readonly _height = 200;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    this._init();
    this._render(this.props.measurementGraphModel);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.measurementGraphModel !== this.props.measurementGraphModel)
      this._render(newProps.measurementGraphModel);
  }

  render() {
    return (
      <div className='measurement-graph'>
        <header>{this.props.measurementGraphModel.name.replace(/_/g, ' ')}</header>
        <svg
          className='canvas'
          ref={elem => this._canvas = elem}
          width={this._width}
          height={this._height}
          viewBox={`0 0 ${this._width} ${this._height}`}
          preserveAspectRatio='xMidYMin meet'>
          <g />
        </svg>
      </div>
    );
  }

  private _init() {
    this._container = select(this._canvas).select('g');
    this._timeScale = scaleTime()
      .range([this._margin.left, this._width - this._margin.right]);
    this._timeScale.tickFormat(5, ':%S');
    this._yScale = scaleLinear()
      .range([this._height - this._margin.bottom, this._margin.top]);
    this._lineGenerator = line<TimeSeriesDataPoint>()
      .x(dataPoint => this._timeScale(dataPoint.primitiveX))
      .y(dataPoint => this._yScale(dataPoint.primitiveY));
  }

  private _render(measurementGraphModel: MeasurementGraphModel) {
    this._container.selectAll('*').remove();

    const axisExtents = this._calculateXYAxisExtents(measurementGraphModel.timeSeries);

    this._timeScale.domain(axisExtents.xExtent);
    this._yScale.domain(axisExtents.yExtent);

    this._renderXAxis(axisExtents.xExtent[0]);
    this._renderYAxis();
    this._renderTimeSeriesLineCharts();
  }

  private _calculateXYAxisExtents(timeSeries: TimeSeries[]): { xExtent: [Date, Date], yExtent: [number, number] } {
    const dataPoints: Array<TimeSeriesDataPoint> = timeSeries.reduce((points, timeSeries) => points.concat(timeSeries.points), []);
    return {
      xExtent: extent<TimeSeriesDataPoint, Date>(dataPoints, point => point.primitiveX),
      yExtent: extent<TimeSeriesDataPoint, number>(dataPoints, point => point.primitiveY)
    };
  }

  private _renderXAxis(startTime: Date) {
    this._container.append('g')
      .attr('class', 'axis x')
      .attr('transform', `translate(0,${this._height - this._margin.bottom})`)
      .call(axisBottom(this._timeScale).tickFormat(this._createTickFormatForXAxis(startTime)));
  }

  private _createTickFormatForXAxis(startTime: Date) {
    return date => String(timeSecond.count(startTime, date));
  }

  private _renderYAxis() {
    this._container.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${this._margin.left},0)`)
      .call(axisLeft(this._yScale));
  }

  private _renderTimeSeriesLineCharts() {
    for (const timeSeries of this.props.measurementGraphModel.timeSeries) {
      this._container.append('path')
        .attr('class', 'time-series-line' + ' _' + timeSeries.name)
        .datum(timeSeries.points)
        .attr('d', this._lineGenerator);
    }
  }
}