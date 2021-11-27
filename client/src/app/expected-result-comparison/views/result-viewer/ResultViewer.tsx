import * as React from 'react';

import { FormControlModel, RadioButtonGroup, RadioButton, Form } from '@shared/form';
import { FilterableTable } from '@shared/filterable-table';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';
import { ExpectedResultComparisonType } from '@shared/ExpectedResultComparisonType';

import { TimeSeriesVsTimeSeriesChartResult } from '../time-series-vs-time-series/TimeSeriesVsTimeSeriesChartResult';

import './ResultViewer.light.scss';
import './ResultViewer.dark.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any[] | any;
  showProgressIndicator: boolean;
  comparisionType: ExpectedResultComparisonType;
}

interface State {
  viewType: 'table' | 'plot';
}

export class ResultViewer extends React.Component<Props, State> {

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
    return (
      <FilterableTable rows={this.props.result} />
    );
  }

  showResultAsPlot() {
    switch (this.props.comparisionType) {
      case ExpectedResultComparisonType.SIMULATION_VS_EXPECTED:
      case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
      case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
        return (
          <MessageBanner>
            Not yet implemented
          </MessageBanner>
        );
      case ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES:
        return (
          <TimeSeriesVsTimeSeriesChartResult result={this.props.result} />
        );
    }
  }

}
