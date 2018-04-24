import * as React from 'react';
import { connect } from 'react-redux';
import { StompSubscription } from '@stomp/stompjs';

import { Plot } from './Plot';
import { AppState } from '../../models/AppState';
import { SimulationControlService } from '../../services/SimulationControlService';
import { PlotModel } from '../../models/plot/PlotModel';
import { TimeSeries } from '../../models/plot/TimeSeries';
import { TimeSeriesDataPoint } from '../../models/plot/TimeSeriesDataPoint';


interface Props {
  dispatch: any;
}

interface State {
  plotModels: PlotModel[];
}

const mapStateToProps = (state: AppState): Props => ({
} as Props);

const SIMULATION_CONTROL_SERVICE = SimulationControlService.getInstance();
const PLOT_NAME_MAP = {
  voltage_A: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],

  voltage_B: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],

  voltage_C: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],

  tap_A: [
    'reg_FEEDER_REG',
    'reg_VREG2',
    'reg_VREG3',
    'reg_VREG4'
  ],

  tap_B: [
    'reg_FEEDER_REG',
    'reg_VREG2',
    'reg_VREG3',
    'reg_VREG4'
  ],

  tap_C: [
    'reg_FEEDER_REG',
    'reg_VREG2',
    'reg_VREG3',
    'reg_VREG4'
  ]
};

let fncsSubscription: StompSubscription = null;
const TIME_SERIES: { [seriesName: string]: TimeSeries } = {};

export const PlotContainer = connect(mapStateToProps)(class PlotContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      plotModels: []
    };
  }

  componentDidMount() {
    if (fncsSubscription) {
      fncsSubscription.unsubscribe();
      fncsSubscription = null;
    }

    fncsSubscription = SIMULATION_CONTROL_SERVICE.onFncsOutputReceived(data => {
      console.log('Fncs Output from PlotContainer:', data);
      if (0) {
        const simulationId = Object.keys(data.output)[0];
        const plotModels = Object.entries(PLOT_NAME_MAP)
          .map(([plotName, timeSeriesNames]) => this._buildPlotModel(plotName, timeSeriesNames, data.output[simulationId]));
        this.setState({ plotModels });
      }
    });
  }

  render() {
    return (
      this.state.plotModels.map(plotModel => <Plot key={plotModel.name} plotModel={plotModel} />)
    );
  }

  private _buildPlotModel(plotName: string, timeSeriesNames: string[], fncsOutputForSimulation: any): PlotModel {
    return timeSeriesNames.map(timeSeriesName => this._buildTimeSeries(timeSeriesName, plotName, fncsOutputForSimulation[timeSeriesName]))
      .reduce((plotModel: PlotModel, timeSeries: TimeSeries) => {
        plotModel.timeSeries.push(timeSeries);
        return plotModel;
      }, { name: plotName, timeSeries: [] });
  }

  private _buildTimeSeries(timeSeriesName: string, plotName: string, timeSeriesData: any): TimeSeries {
    const timeSeries: TimeSeries = TIME_SERIES[timeSeriesName] || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(plotName, timeSeriesData));
    TIME_SERIES[timeSeriesName] = timeSeries;
    return timeSeries;
  }

  private _getDataPointForTimeSeries(plotName: string, timeSeriesData: any): TimeSeriesDataPoint {
    const dataPoint = { primitiveX: new Date(Date.now()), primitiveY: 0 };
    if (plotName.includes('voltage') || plotName.includes('power_in')) {
      // Use a regex to parse a string like this:
      // voltage: 6319.15-4782.82j V
      // power_in: 1.75641e+06-808539j VA
      // In Node, the same regex works for with e+06 and without. 
      // For some reason, in Chrome, it doesn't. Using separate regexes for now.
      const valueString = timeSeriesData[plotName];
      let regex = /[+|-]?(\d+\.?\d+?e?[+|-]?\d+?)[+|-](\d+\.?\d+?)j V/; // TODO: doens't handle imaginary numbers with e+06, etc.
      if (valueString.indexOf('e') < 0) {
        regex = /[+|-]?(\d+\.?\d+?)[+|-](\d+\.?\d+?)j V/;
      }
      const [, real, imag] = valueString.match(regex);
      // TODO: This is not really a per-unit voltage. I don't know 
      // what the nominal voltage would be.
      // How does the team want to combine these values into a single
      // stat to display in the plot? 
      // Or do they want to choose real or imaginary?
      dataPoint.primitiveY = Math.sqrt(Math.pow(+real, 2) + Math.pow(+imag, 2));
    }
    else
      dataPoint.primitiveY = +timeSeriesData[plotName];
    return dataPoint;
  }
});