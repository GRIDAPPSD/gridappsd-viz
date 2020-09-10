import * as React from 'react';

import { FormControlModel, RadioButtonGroup, RadioButton, Form } from '@shared/form';
import { FilterableTable } from '@shared/filterable-table';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';

import './ResultViewer.light.scss';
import './ResultViewer.dark.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any[];
  showProgressIndicator: boolean;
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
                ? this.showResultsAsTable()
                : this.showResultsAsPlot()
          }
        </div>
      </div>
    );
  }

  showResultsAsTable() {
    return (
      <FilterableTable rows={this.props.results} />
    );
  }

  showResultsAsPlot() {
    return (
      <MessageBanner>
        Not yet implemented
      </MessageBanner>
    );
  }

}
