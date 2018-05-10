import * as React from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleTime, ScaleTime, ScaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { line, Line } from 'd3-shape';
import { extent } from 'd3-array';

import { PlotModel } from '../../models/plot/PlotModel';
// import { Wait } from '../wait/Wait';
import './Plot.styles.scss';
import { TimeSeriesDataPoint } from '../../models/plot/TimeSeriesDataPoint';
import { TimeSeries } from '../../models/plot/TimeSeries';

interface Props {
  plotModel: PlotModel;
}

interface State {
}

export class Plot extends React.Component<Props, State> {

  private _canvas: SVGSVGElement = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _timeScale: ScaleTime<number, number> = null;
  private _yScale: ScaleLinear<number, number> = null;
  private _lineGenerator: Line<TimeSeriesDataPoint> = null;
  private readonly _MARGIN = { top: 10, bottom: 20, left: 70, right: 10 };
  private _WIDTH = 370;
  private readonly _HEIGHT = 200;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    this._init();
    this._render(this.props.plotModel);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.plotModel !== this.props.plotModel)
      this._render(newProps.plotModel);
  }

  render() {
    return (
      <div className='plot'>
        <header>{this.props.plotModel.name.replace(/_/g, ' ')}</header>
        <svg
          className='canvas'
          ref={elem => this._canvas = elem}
          width={this._WIDTH}
          height={this._HEIGHT}>
          <g />
        </svg>
      </div>
    );
  }

  private _init() {
    this._container = select(this._canvas).select('g');
    this._timeScale = scaleTime()
      .range([this._MARGIN.left, this._WIDTH - this._MARGIN.right]);
    this._timeScale.tickFormat(5, ':%S');
    this._yScale = scaleLinear()
      .range([this._HEIGHT - this._MARGIN.bottom, this._MARGIN.top]);
    this._lineGenerator = line<TimeSeriesDataPoint>()
      .x(dataPoint => this._timeScale(dataPoint.primitiveX))
      .y(dataPoint => this._yScale(dataPoint.primitiveY));
  }

  private _render(plotModel: PlotModel) {
    this._container.selectAll('*').remove();

    const axisExtents = this._calculateXYAxisExtents(this.props.plotModel.timeSeries);

    this._timeScale.domain(axisExtents.xExtent);
    this._yScale.domain(axisExtents.yExtent);

    this._container.append('g')
      .attr('class', 'axis x')
      .attr('transform', `translate(0,${this._HEIGHT - this._MARGIN.bottom})`)
      .call(axisBottom(this._timeScale));

    this._container.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${this._MARGIN.left},0)`)
      .call(axisLeft(this._yScale));

    for (const timeSeries of this.props.plotModel.timeSeries) {
      this._container.append('path')
        .attr('class', 'time-series-line' + ' _' + timeSeries.name)
        .datum(timeSeries.points)
        .attr('d', this._lineGenerator);
    }
  }

  private _calculateXYAxisExtents(timeSeries: TimeSeries[]): { xExtent: Array<Date>, yExtent: Array<number> } {
    const dataPoints: Array<TimeSeriesDataPoint> = timeSeries.reduce((points, timeSeries) => points.concat(timeSeries.points), []);
    return {
      xExtent: extent<TimeSeriesDataPoint, Date>(dataPoints, point => point.primitiveX),
      yExtent: extent<TimeSeriesDataPoint, number>(dataPoints, point => point.primitiveY)
    };
  }
}