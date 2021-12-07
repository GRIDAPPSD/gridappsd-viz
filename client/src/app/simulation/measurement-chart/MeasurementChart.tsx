import { Component, createRef } from 'react';
import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleTime, ScaleTime, ScaleLinear } from 'd3-scale';
import { axisBottom, axisLeft, Axis } from 'd3-axis';
import { extent } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { format as numberFormat } from 'd3-format';
import { Subscription } from 'rxjs';

import { StateStore } from '@client:common/state-store';
import { Ripple } from '@client:common/ripple';
import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';
import { DateTimeService } from '@client:common/DateTimeService';

import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { RenderableChartModel } from './models/RenderableChartModel';

import './MeasurementChart.light.scss';
import './MeasurementChart.dark.scss';

interface Props {
  renderableChartModel: RenderableChartModel;
}

interface State {
  overlappingTimeSeries: TimeSeries[];
  disableZoomOutButton: boolean;
  disableZoomInButton: boolean;
}

export class MeasurementChart extends Component<Props, State> {

  readonly width = 370;
  readonly height = 280;
  readonly margin = {
    top: 20,
    bottom: 35,
    left: 70,
    right: 10
  };

  readonly svgRef = createRef<SVGSVGElement>();

  private readonly _stateStore = StateStore.getInstance();
  private readonly _xScale: ScaleTime<number, number>;
  private readonly _yScale: ScaleLinear<number, number>;
  private readonly _xAxisGenerator: Axis<Date>;
  private readonly _yAxisGenerator: Axis<number>;
  private readonly _xAxisSlidingWindow = [0, 20] as [number, number];
  private readonly _dateTimeService = DateTimeService.getInstance();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _container: Selection<SVGElement, any, SVGElement, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _xAxis: Selection<SVGElement, any, SVGElement, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _yAxis: Selection<SVGGElement, any, SVGElement, any>;
  private _timeZoneChangeSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      overlappingTimeSeries: [],
      disableZoomOutButton: true,
      disableZoomInButton: false
    };

    this._xScale = scaleTime()
      .range([this.margin.left, this.width - this.margin.right]);

    this._yScale = scaleLinear()
      .domain([Infinity, -Infinity])
      .range([this.height - this.margin.bottom, this.margin.top]);

    const xAxisTickFormatter = timeFormat('%H:%M:%S');
    this._xAxisGenerator = axisBottom<Date>(this._xScale)
      .ticks(5)
      .tickFormat(date => xAxisTickFormatter(this._dateTimeService.resolveDateTime(date)));

    this._yAxisGenerator = axisLeft<number>(this._yScale)
      .tickFormat(numberFormat(',.7'));

    this.zoomOut = this.zoomOut.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
  }

  componentDidMount() {
    this._container = select(this.svgRef.current.querySelector('.measurement-chart__canvas__container') as SVGElement);
    this._xAxis = this._container.select('.measurement-chart__canvas__axis.x');
    this._yAxis = this._container.select('.measurement-chart__canvas__axis.y');

    this._timeZoneChangeSubscription = this._stateStore.select('timeZone')
      .subscribe({
        next: () => {
          this._xAxis.call(this._xAxisGenerator as any);
        }
      });
    this._render();
  }

  private _render() {
    this.setState({
      overlappingTimeSeries: this._findOverlappingTimeSeries()
    });

    const axisExtents = this._calculateXYAxisExtents();
    if (axisExtents.y[0] === axisExtents.y[1]) {
      axisExtents.y[0] = 0;
    }

    this._renderXAxis(axisExtents.x);
    this._renderYAxis(axisExtents.y);
    this._renderTimeSeriesLineCharts();
  }

  private _findOverlappingTimeSeries() {
    const overlappingTimeSeries = [];
    for (const suspect of this.props.renderableChartModel.timeSeries) {
      if (suspect.points.length >= 2 && this._suspectSeriesOverlapsOtherSeries(suspect)) {
        overlappingTimeSeries.push(suspect);
      }
    }
    return overlappingTimeSeries;
  }

  private _suspectSeriesOverlapsOtherSeries(suspect: TimeSeries) {
    for (const current of this.props.renderableChartModel.timeSeries) {
      // Only checking for the first and last datapoints
      // to determine if the provided series overlaps some other series which is good enough
      if (
        current !== suspect
        && this._tooClose(current.points[0], suspect.points[0])
        && this._tooClose(current.points[current.points.length - 1], suspect.points[suspect.points.length - 1])
      ) {
        return true;
      }
    }
    return false;
  }

  private _tooClose(dataPoint1: TimeSeriesDataPoint, dataPoint2: TimeSeriesDataPoint) {
    return Math.abs(this._yScale(dataPoint1.measurement) - this._yScale(dataPoint2.measurement)) <= 2;
  }

  private _calculateXYAxisExtents(): { x: [Date, Date]; y: [number, number] } {
    const [left, right] = this._xAxisSlidingWindow;
    const dataPoints: Array<TimeSeriesDataPoint> = this.props.renderableChartModel.timeSeries.reduce(
      (accumulator, series) => {
        for (let i = left; i > -1; i--) {
          if (i in series.points) {
            accumulator.push(...series.points.slice(i, right));
            break;
          }
        }
        return accumulator;
      },
      []
    );
    return {
      x: extent<TimeSeriesDataPoint, Date>(dataPoints, point => point.timestamp),
      y: extent<TimeSeriesDataPoint, number>(dataPoints, point => point.measurement)
    };
  }

  private _renderXAxis(xAxisExtent: [Date, Date]) {
    this._xScale.domain(xAxisExtent);
    this._xAxisGenerator.scale(this._xScale);
    this._xAxis.call(this._xAxisGenerator as any)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.4em')
      .attr('dy', '.45em')
      .attr('transform', 'rotate(-35)');
  }

  private _renderYAxis(yAxisExtent: [number, number]) {
    this._yScale.domain(yAxisExtent);
    this._yAxisGenerator.scale(this._yScale);
    this._yAxis.call(this._yAxisGenerator);
  }

  private _renderTimeSeriesLineCharts() {
    this._container.selectAll('.measurement-chart__canvas__time-series-line')
      .data(this.props.renderableChartModel.timeSeries)
      .join(enter => enter.append('polyline').attr('class', 'measurement-chart__canvas__time-series-line'))
      .attr('clip-path', 'url(#clipping-area)')
      .transition()
      .duration(175)
      .attr('points', timeSeries => timeSeries.points.map(e => this._createXYPair(e)).join(' '));
  }

  private _createXYPair(point: TimeSeriesDataPoint) {
    return `${this._xScale(point.timestamp)},${this._yScale(point.measurement)}`;
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.renderableChartModel !== this.props.renderableChartModel) {
      this._render();
    }
  }

  componentWillUnmount() {
    this._timeZoneChangeSubscription.unsubscribe();
  }

  render() {
    return (
      <div className='measurement-chart'>
        <header className='measurement-chart__name'>
          {this.props.renderableChartModel.name}
        </header>
        <div className='measurement-chart__legend-container'>
          {
            this.props.renderableChartModel.timeSeries.map(timeSeries => (
              <Ripple key={timeSeries.name}>
                <div
                  className='measurement-chart__legend'
                  onClick={() => this.locateNodeForTimeSeriesLine(timeSeries.name)}>
                  <div className='measurement-chart__legend__color' />
                  <div className='measurement-chart__legend__label'>
                    {timeSeries.name}
                  </div>
                </div>
              </Ripple>
            ))
          }
        </div>
        <div className='measurement-chart__zoom-control-container'>
          <Tooltip content='Zoom out'>
            <IconButton
              icon='remove'
              size='small'
              style='accent'
              disabled={this.state.disableZoomOutButton}
              onClick={this.zoomOut} />
          </Tooltip>
          <Tooltip content='Zoom in'>
            <IconButton
              icon='add'
              size='small'
              style='accent'
              disabled={this.state.disableZoomInButton}
              onClick={this.zoomIn} />
          </Tooltip>
        </div>
        <svg
          className='measurement-chart__canvas'
          ref={this.svgRef}
          width={this.width}
          height={this.height}
          viewBox={`0 0 ${this.width} ${this.height}`}
          preserveAspectRatio='xMidYMin meet'>
          <clipPath id='clipping-area'>
            <rect
              x={this.margin.left}
              y='0'
              width={this.width - this.margin.left - this.margin.right}
              height={this.height} />
          </clipPath>
          <g className='measurement-chart__canvas__container'>
            <g
              className='measurement-chart__canvas__axis x'
              transform={`translate(0,${this.height - this.margin.bottom})`} />
            <g
              className='measurement-chart__canvas__axis y'
              transform={`translate(${this.margin.left},0)`} />
            <text
              className='measurement-chart__canvas__axis-label'
              x={this.margin.left}
              y={this.margin.top}
              dy='-5'
              textAnchor='middle'>
              {this.props.renderableChartModel.yAxisLabel}
            </text>
            {this.showLabelsForOverlappingTimeSeries()}
          </g>
        </svg>
      </div>
    );
  }

  locateNodeForTimeSeriesLine(timeSeriesName: string) {
    this._stateStore.update({
      nodeNameToLocate: timeSeriesName.replace(/\s*\([\s\S]+\)\s*/g, '')
    });
  }

  zoomOut() {
    const leftEdgeOfWindow = Math.max(0, this._xAxisSlidingWindow[0] - 1);
    this._xAxisSlidingWindow[0] = leftEdgeOfWindow;
    this.setState({
      disableZoomOutButton: leftEdgeOfWindow === 0,
      disableZoomInButton: false
    });
    this._render();
  }

  zoomIn() {
    const maximumLeftEdgeOfWindow = this._xAxisSlidingWindow[1] - 2;
    const leftEdgeOfWindow = Math.min(maximumLeftEdgeOfWindow, this._xAxisSlidingWindow[0] + 1);
    this._xAxisSlidingWindow[0] = leftEdgeOfWindow;
    this.setState({
      disableZoomInButton: leftEdgeOfWindow === maximumLeftEdgeOfWindow,
      disableZoomOutButton: false
    });
    this._render();
  }

  showLabelsForOverlappingTimeSeries() {
    if (this.state.overlappingTimeSeries.length === 0 || this.state.overlappingTimeSeries[0].points[0] === undefined) {
      return null;
    }
    const paddingLeft = 10;
    const x = this.margin.left + paddingLeft;
    const paddingBottom = 5;
    const y = this._yScale(this.state.overlappingTimeSeries[0].points[0].measurement) - paddingBottom;
    return (
      <text
        x={x}
        y={y}
        className='measurement-chart__canvas__overlapped-lines'>
        {this.state.overlappingTimeSeries.map(e => e.name).join(', ')}
      </text>
    );
  }

}
