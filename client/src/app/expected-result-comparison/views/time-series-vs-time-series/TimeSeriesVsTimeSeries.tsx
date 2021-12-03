import { Component } from 'react';

import { Form, SelectionOptionBuilder, FormGroupModel, FormControlModel, Select } from '@client:common/form';
import { BasicButton } from '@client:common/buttons';

import './TimeSeriesVsTimeSeries.light.scss';
import './TimeSeriesVsTimeSeries.dark.scss';

interface Props {
  simulationIds: string[];
  onSubmit: (firstSimulationId: number, secondSimulationId: number) => void;
}

interface State {
  firstSimulationIdOptionBuilder: SelectionOptionBuilder<string>;
  secondSimulationIdOptionBuilder: SelectionOptionBuilder<string>;
  disableSubmitButton: boolean;
}

export class TimeSeriesVsTimeSeries extends Component<Props, State> {

  readonly formGroup = new FormGroupModel({
    firstSimulationId: new FormControlModel(''),
    secondSimulationId: new FormControlModel('')
  });

  constructor(props: Props) {
    super(props);

    this.state = {
      firstSimulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
      secondSimulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
      disableSubmitButton: true
    };

    this.onSubmit = this.onSubmit.bind(this);

  }

  componentDidMount() {
    this.formGroup.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.simulationIds !== this.props.simulationIds) {
      this.setState({
        firstSimulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds),
        secondSimulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds)
      });
    }
  }

  componentWillUnmount() {
    this.formGroup.cleanup();
  }

  render() {
    return (
      <Form className='time-series-vs-time-series-form'>
        <Select
          label='First simulation ID'
          selectionOptionBuilder={this.state.firstSimulationIdOptionBuilder}
          formControlModel={this.formGroup.findControl('firstSimulationId')} />
        <Select
          label='Second simulation ID'
          selectionOptionBuilder={this.state.secondSimulationIdOptionBuilder}
          formControlModel={this.formGroup.findControl('secondSimulationId')} />
        <BasicButton
          type='positive'
          label='Submit'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmit} />
      </Form>
    );
  }

  onSubmit() {
    const formValue = this.formGroup.getValue();
    this.props.onSubmit(+formValue.firstSimulationId, +formValue.secondSimulationId);
    this.setState({
      disableSubmitButton: true
    });
  }

}
