/* eslint-disable no-console */
// import { Component } from 'react';

// import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';

// import './TimeSeriesVsTimeSeriesChartResult.light.scss';
// import './TimeSeriesVsTimeSeriesChartResult.dark.scss';

// interface Props {
//   result: Array<{
//     object: string;
//     attribute: 'angle' | 'magnitude' | 'value';
//     indexOne: number;
//     indexTwo: number;
//     simulationTimestamp: number;
//     expected: string;
//     actual: string;
//     diffMrid: string;
//     diffType: string;
//     match: boolean;
//   }>;
// }

// interface State {
//   chartModels: LineChartModel[];
// }

// export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

//   constructor(props: Props) {
//     super(props);

//     this.state={
//       chartModels: []
//     };
//   }

//   componentDidMount() {
//       this._buildChart();
//   }

//   componentDidUpdate(prevProps: Readonly<Props>): void {
//       if(prevProps.result.length !== this.props.result.length) {
//         this._buildChart();
//       }
//   }

//   private _buildChart() {
//     const chartModelMap = new Map<string, LineChartModel>();
//     const anchorTimeStamp = Date.now();
//     if(this.props.result.length > 1) {
//       for(const datum of this.props.result) {
//         if(!chartModelMap.has(datum.attribute)) {
//           chartModelMap.set(datum.attribute, this._createLineChartModelForAttribute(datum.attribute));
//         }
//         const chartModel = chartModelMap.get(datum.attribute);
//         const expectedValueTimeSeries = chartModel.timeSeries[0];
//         const actualValueTimeSeries = chartModel.timeSeries[1];
//         const nextTimeStamp = new Date(anchorTimeStamp + expectedValueTimeSeries.points.length + 1);

//         expectedValueTimeSeries.points.push({
//           timestamp: nextTimeStamp,
//           measurement: +datum.expected
//         });

//         actualValueTimeSeries.points.push({
//           timestamp: nextTimeStamp,
//           measurement: +datum.actual
//         });
//       }
//       this.setState({
//         chartModels: [...chartModelMap.values()]
//       });
//     }
//   }

//   private _createLineChartModelForAttribute(attribute: string): LineChartModel {
//     return {
//       name: attribute,
//       yAxisLabel: '',
//       timeSeries: [
//         this._createTimeSeries('expected'),
//         this._createTimeSeries('actual')
//       ]
//     };
//   }

//   private _createTimeSeries(timeSeriesName: 'actual' | 'expected'): TimeSeries {
//     return {
//       name: timeSeriesName,
//       points: []
//     };
//   }

//   render() {
//     return (
//       <div className='time-series-vs-time-series-chart-result'>
//         {
//           this.state.chartModels.map(model => {
//             return (
//               <LineChart
//               key={model.name}
//               lineChartModel={model} />
//             );
//           })
//         }
//       </div>
//     );
//   }

// }

// ============================
// ============================
// ============================

import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
// import { NewLineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';

import './TimeSeriesVsTimeSeriesChartResult.light.scss';
import './TimeSeriesVsTimeSeriesChartResult.dark.scss';

interface Props {
  result: Array<{
    object: string;
    attribute: 'angle' | 'magnitude' | 'value';
    indexOne: number;
    indexTwo: number;
    simulationTimestamp: number;
    expected: string;
    actual: string;
    diffMrid: string;
    diffType: string;
    match: boolean;
  }>;
}

interface State {
  chartModels: LineChartModel[];
}

export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state={
      chartModels: []
    };
  }

  componentDidMount() {
    this._buildChart();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
      if(prevProps.result.length !== this.props.result.length && this.props.result.length >= 4) {
        this._buildChart();
      }
  }

  private _buildChart() {
    const chartModelMap = new Map<string, LineChartModel>();
    const anchorTimeStamp = Date.now();
    if(this.props.result.length > 1) {
      // console.log('this.props.result->', this.props.result);
      // [{...}, {...}, {...}, ...]
      // 0:
      //   actual: "524838.2932491909"
      //   attribute: "magnitude" // angle
      //   diffMrid: "NA"
      //   diffType: "NA"
      //   expected: "545946.405945774"
      //   indexOne: 1644251651
      //   indexTwo: 1644251651
      //   match: false
      //   object: "_def62366-746e-4fcb-b3ee-ebebb90d72d4"
      //   simulationTimestamp: 0
      for(const datum of this.props.result) {
        if(!chartModelMap.has(datum.attribute)) {
          chartModelMap.set(datum.attribute, this._createLineChartModelForAttribute(datum.attribute));
        }
        const chartModel = chartModelMap.get(datum.attribute);
        // console.log('!!!chartModel!!');
        // console.log(chartModel);
        // Object:
        //   name: "magnitude"
        //   timeSeries: Array(2)
        //      0: {name: 'expected', points: Array(405)}
        //      1: {name: 'actual', points: Array(405)}
        //          points: Array(405)
        //            0: {timestamp: Wed Feb 16 2022 17:57:38 GMT-0800 (Pacific Standard Time), measurement: 524838.2932491909}
        // console.log('#####chartModel.timeSeries[0]');
        // console.log(chartModel.timeSeries[0]);
        // name: "expected"
        // points:[{...}, {...}, ...]
        //    {timestamp: Wed Feb 16 2022 14:23:52 GMT-0800 (Pacific Standard Time), measurement: 545946.405945774}

        // console.log('anchorTimeStamp=========');
        // console.log(anchorTimeStamp);
        // 1645044222431
        // console.log('chartModel.timeSeries[0].points.length=========');
        // console.log(chartModel.timeSeries[0].points.length);
        // 318

        const nextTimeStamp = new Date(anchorTimeStamp + chartModel.timeSeries[0].points.length + 1);
        // console.log('nextTimeStamp=========');
        // console.log(nextTimeStamp);
        // Wed Feb 16 2022 12:43:42 GMT-0800 (Pacific Standard Time)

        // expectedValueTimeSeries.points.push({
        //   timestamp: nextTimeStamp,
        //   measurement: +datum.expected
        // });

        // console.log('measurement: datum.expected===', datum.expected);
        // console.log('measurement: datum.actual===', datum.actual);
        if(datum.attribute === 'angle') {

          // console.log('expected measurement=======', datum.expected);
        }
        chartModel.timeSeries[0].points.push({
          timestamp: nextTimeStamp,
          measurement: +datum.expected
        });

        // actualValueTimeSeries.points.push({
        //   timestamp: nextTimeStamp,
        //   measurement: +datum.actual
        // });
        // console.log('actual measurement======', datum.actual);
        chartModel.timeSeries[1].points.push({
          timestamp: nextTimeStamp,
          measurement: +datum.actual
        });
      }
      // console.log('chartModelMap angle value=========');
      // console.log(chartModelMap.get('angle'));
      this.setState({
        chartModels: [...chartModelMap.values()]
      });
    }
  }

  private _createLineChartModelForAttribute(attribute: string): LineChartModel {
    // console.log('attribute######', attribute);
    return {
      name: attribute,
      yAxisLabel: '',
      timeSeries: [
        this._createTimeSeries('expected'),
        this._createTimeSeries('actual')
      ]
    };
  }

  private _createTimeSeries(timeSeriesName: 'actual' | 'expected'): TimeSeries {
    // console.log('timeSeriesName####', timeSeriesName);
    return {
      name: timeSeriesName,
      points: []
    };
  }

  render() {
    return (
      <div className='time-series-vs-time-series-chart-result'>
        {
          this.state.chartModels.map(model => {
            // console.log('model ==>', model);
            // model ==> {name: 'angle', yAxisLabel: '', timeSeries: Array(2)}name: "angle"timeSeries: (2)[{…}, {…}]yAxisLabel: ""[[Prototype]]: Object
            // model ==> {name: 'magnitude', yAxisLabel: '', timeSeries: Array(2)}
            // model ==> {name: 'value', yAxisLabel: '', timeSeries: Array(2)}name: "value"timeSeries: (2)[{…}, {…}]yAxisLabel: ""[[Prototype]]: Object
            // model ==> {name: 'angle', yAxisLabel: '', timeSeries: Array(2)}
            // model ==> {name: 'magnitude', yAxisLabel: '', timeSeries: Array(2)}
            // model ==> {name: 'value', yAxisLabel: '', timeSeries: Array(2)}
            return (
              <LineChart
              // <NewLineChart
              key={model.name}
              lineChartModel={model} />
            );
          })
        }
      </div>
    );
  }

}


// ===== old
// import { Component } from 'react';

// import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';

// import './TimeSeriesVsTimeSeriesChartResult.light.scss';
// import './TimeSeriesVsTimeSeriesChartResult.dark.scss';

// interface Props {
//   result: Array<{
//     object: string;
//     attribute: 'angle' | 'magnitude' | 'value';
//     indexOne: number;
//     indexTwo: number;
//     simulationTimestamp: number;
//     expected: string;
//     actual: string;
//     diffMrid: string;
//     diffType: string;
//     match: boolean;
//   }>;
// }

// interface State {
//   chartModels: LineChartModel[];
// }

// export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

//   constructor(props: Props) {
//     super(props);

//     const chartModelMap = new Map<string, LineChartModel>();
//     const anchorTimeStamp = Date.now();

//     for (const datum of props.result) {
//       if (!chartModelMap.has(datum.attribute)) {
//         chartModelMap.set(datum.attribute, this._createLineChartModelForAttribute(datum.attribute));
//       }
//       const chartModel = chartModelMap.get(datum.attribute);
//       const expectedValueTimeSeries = chartModel.timeSeries[0];
//       const actualValueTimeSeries = chartModel.timeSeries[1];
//       const nextTimeStamp = new Date(anchorTimeStamp + expectedValueTimeSeries.points.length + 1);

//       expectedValueTimeSeries.points.push({
//         timestamp: nextTimeStamp,
//         measurement: +datum.expected
//       });

//       actualValueTimeSeries.points.push({
//         timestamp: nextTimeStamp,
//         measurement: +datum.actual
//       });
//     }

//     this.state = {
//       chartModels: [...chartModelMap.values()]
//     };
//   }

//   private _createLineChartModelForAttribute(attribute: string): LineChartModel {
//     return {
//       name: attribute,
//       yAxisLabel: '',
//       timeSeries: [
//         this._createTimeSeries('expected'),
//         this._createTimeSeries('actual')
//       ]
//     };
//   }

//   private _createTimeSeries(timeSeriesName: 'actual' | 'expected'): TimeSeries {
//     return {
//       name: timeSeriesName,
//       points: []
//     };
//   }

//   render() {
//     return (
//       <div className='time-series-vs-time-series-chart-result'>
//         {
//           this.state.chartModels.map(model => (
//             <LineChart
//               key={model.name}
//               lineChartModel={model} />
//           ))
//         }
//       </div>
//     );
//   }

// }
