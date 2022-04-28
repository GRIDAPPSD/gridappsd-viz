import { Component } from 'react';

import { FormControlModel, RadioButtonGroup, RadioButton, Form } from '@client:common/form';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { FilterableTable } from '@client:common/filterable-table';
import { ModelDictionaryComponent } from '@client:common/topology';

import { TimeSeriesVsTimeSeriesChartResult } from '../time-series-vs-time-series/TimeSeriesVsTimeSeriesChartResult';
import { ExpectedVsTimeSeriesChartResult } from '../expected-vs-time-series/ExpectedVsTimeSeriesChartResult';
import { SimulationVsTimeSeriesChartResult } from '../simulation-vs-time-series/SimulationVsTimeSeriesChartResult';
import { SimulationVsExpectedChartResult } from '../simulation-vs-expected/SimulationVsExpectedChartResult';

import './ResultViewer.light.scss';
import './ResultViewer.dark.scss';

interface Props {
  startFetchingAfterSubmit: boolean;
  result: any[] | any;
  showProgressIndicator: boolean;
  comparisonType: ExpectedResultComparisonType;
  modelDictionaryComponentsCaches: ModelDictionaryComponent[];
  phaseAndMeasurementMRIDMapping: Map<string[], string[]>;
}

interface State {
  viewType: 'table' | 'plot';
}

export class ResultViewer extends Component<Props, State> {

  readonly viewTypeFormControlModel = new FormControlModel<'table' | 'plot'>('table');

  constructor(props: Props) {
    super(props);

    this.state = {
      viewType: 'table'
    };

  }

  componentDidMount() {
    this.viewTypeFormControlModel.valueChanges()
      .subscribe({
        next: selectedType => {
          this.setState({
            viewType: selectedType
          });
        }
      });
  }

  componentWillUnmount() {
    this.viewTypeFormControlModel.cleanup();
  }

  render() {
    return (
      <div className='result-viewer'>
        <Form className='result-viewer__form'>
          <RadioButtonGroup
            label='View as'
            id='view-type'
            formControlModel={this.viewTypeFormControlModel}>
            <RadioButton
              selected={this.state.viewType === 'table'}
              label='Table'
              value='table' />
            <RadioButton
              label='Plot'
              value='plot' />
          </RadioButtonGroup>
        </Form>
        <div className='result-viewer__body'>
          {
            this.props.showProgressIndicator
              ? <ProgressIndicator show />
              : this.state.viewType === 'table'
                ? this.showResultAsTable()
                : this.showResultAsPlot()
          }
        </div>
      </div>
    );
  }

  showResultAsTable() {
    switch (this.props.comparisonType) {
      // * Without events in the result:
      case ExpectedResultComparisonType.SIMULATION_VS_EXPECTED:
        return (
          // filter out the result objects that does not contain events type
          <FilterableTable
            rows={this.props.result.filter(function(value: string) {
              return !Object.prototype.hasOwnProperty.call(value, 'events');
            })}
            modelDictionaryComponentsCaches={this.props.modelDictionaryComponentsCaches} />
        );
      case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
      case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
      case ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES:
        return (
          <FilterableTable
          rows={this.props.result}
          modelDictionaryComponentsCaches={this.props.modelDictionaryComponentsCaches} />
        );
    }
  }

  showResultAsPlot() {
    switch (this.props.comparisonType) {
      case ExpectedResultComparisonType.SIMULATION_VS_EXPECTED:
        return (
          <SimulationVsExpectedChartResult
          result={this.props.result}
          startFetchingAfterSubmit={this.props.startFetchingAfterSubmit}
          phaseAndMeasurementMRIDMapping={this.props.phaseAndMeasurementMRIDMapping} />
        );
      case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
        return (
          <SimulationVsTimeSeriesChartResult
          startFetchingAfterSubmit={this.props.startFetchingAfterSubmit}
          phaseAndMeasurementMRIDMapping={this.props.phaseAndMeasurementMRIDMapping}
          result={this.props.result} />
        );
      case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
        return (
          <ExpectedVsTimeSeriesChartResult
          startFetchingAfterSubmit={this.props.startFetchingAfterSubmit}
          phaseAndMeasurementMRIDMapping={this.props.phaseAndMeasurementMRIDMapping}
          result={this.props.result} />
        );
      case ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES:
        return (
          <TimeSeriesVsTimeSeriesChartResult
           startFetchingAfterSubmit={this.props.startFetchingAfterSubmit}
           phaseAndMeasurementMRIDMapping={this.props.phaseAndMeasurementMRIDMapping}
           result={this.props.result} />
        );
    }
  }

}
