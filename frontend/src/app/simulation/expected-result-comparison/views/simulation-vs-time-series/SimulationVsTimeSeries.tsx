/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { Form, Select, FormControlModel, SelectionOptionBuilder } from '@shared/form';

import './SimulationVsTimeSeries.light.scss';
import './SimulationVsTimeSeries.dark.scss';

interface Props {
  simulationIds: string[];
  onSubmit: (simulationId: number) => void;
}

interface State {
  simulationIdOptionBuilder: SelectionOptionBuilder<string>;
  disableSubmitButton: boolean;
}

export class SimulationVsTimeSeries extends React.Component<Props, State> {

  readonly simulationFormControl = new FormControlModel('');

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
      disableSubmitButton: true
    };

    this.onSubmit = this.onSubmit.bind(this);

  }

  componentDidMount() {
    this.simulationFormControl.validityChanges()
      .subscribe({
        next: isValid => {
          if (!isValid !== this.state.disableSubmitButton) {
            this.setState({
              disableSubmitButton: !isValid
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.simulationFormControl.cleanup();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.simulationIds !== this.props.simulationIds) {
      this.setState({
        simulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds)
      });
    }
  }

  render() {
    return (
      <Form className='simulation-vs-time-series-form'>
        <Select
          label='Simulation ID'
          selectionOptionBuilder={this.state.simulationIdOptionBuilder}
          formControlModel={this.simulationFormControl} />
        <BasicButton
          type='positive'
          label='Submit'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmit} />
      </Form>
    );
  }

  onSubmit() {
    this.props.onSubmit(+this.simulationFormControl.getValue());
    this.setState({
      disableSubmitButton: true
    });
  }

}
