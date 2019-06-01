import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { ModelDictionary } from '@shared/topology/model-dictionary';
import { FormGroup, Select, Option, Input } from '@shared/form';
import { FaultEvent, FaultKind, FaultImpedence } from '../../models/FaultEvent';

import './FaultEventForm.scss';

interface Props {
  onEventAdded: (event: FaultEvent) => void;
  initialFormValue: FaultEvent;
  modelDictionary: ModelDictionary;
}

interface State {
  equipmentTypeOptions: Option<string>[];
  componentOptions: Option<any>[];
  phaseOptions: Option<string>[];
  faultKindOptions: Option<FaultKind>[];
  selectedFaultKind: FaultKind;
  formValue: FaultEvent;
}

export class FaultEventForm extends React.Component<Props, State> {
  formValue: FaultEvent;
  equipmentTypeSelect: Select<string>;

  constructor(props: Props) {
    super(props);
    this.state = {
      equipmentTypeOptions: [
        new Option('Battery', 'batteries'),
        new Option('Breaker', 'breakers'),
        new Option('Capacitor', 'capacitors'),
        new Option('Disconnector', 'disconnectors'),
        new Option('Fuse', 'fuses'),
        new Option('Recloser', 'reclosers'),
        new Option('Regulator', 'regulators'),
        new Option('Sectionaliser', 'sectionalisers'),
        new Option('Solar Panel', 'solarpanels'),
        new Option('Switch', 'switches'),
        new Option('Synchronous Machine', 'synchronousmachines')
      ],
      componentOptions: [],
      phaseOptions: [],
      faultKindOptions: [
        new Option(FaultKind.LINE_TO_GROUND),
        new Option(FaultKind.LINE_TO_LINE),
        new Option(FaultKind.LINE_TO_LINE_TO_GROUND)
      ],
      selectedFaultKind: FaultKind.LINE_TO_GROUND,
      formValue: { ...props.initialFormValue }
    };
    this.formValue = this.state.formValue;
  }

  generateUniqueOptions(iterable: string[] | string): Option[] {
    const result = [];
    for (const element of iterable)
      if (!result.includes(element))
        result.push(new Option(element));
    return result;
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.initialFormValue !== this.props.initialFormValue) {
      const formValue = { ...this.props.initialFormValue };
      this.setState({ formValue });
      this.formValue = formValue;
    }
  }

  render() {
    return (
      <div className='fault-event'>
        <Select
          ref={comp => this.equipmentTypeSelect = comp}
          label='Equipment Type'
          options={this.state.equipmentTypeOptions}
          onChange={options => {
            const components = this.props.modelDictionary[options[0].value] || [];
            this.setState({
              componentOptions: components.map(e => new Option(e.name || e.bankName, e)),
              phaseOptions: []
            });
            this.formValue.equipmentType = options[0].label;
          }} />
        <Select
          label='Name'
          options={this.state.componentOptions}
          onChange={options => {
            this.setState({
              phaseOptions: this.generateUniqueOptions(options[0].value.phases || options[0].value.bankPhases)
                .sort((a, b) => a.label.localeCompare(b.label))
            });
            this.formValue.equipmentName = options[0].label;
          }} />
        <Select
          label='Phase'
          options={this.state.phaseOptions}
          onChange={options => this.formValue.phase = options[0].value} />
        <Select
          label='Phase Connected Fault Kind'
          options={this.state.faultKindOptions}
          isOptionSelected={option => option.value === this.formValue.faultKind}
          onChange={options => {
            this.formValue.faultKind = options[0].value;
            this.setState({
              selectedFaultKind: this.formValue.faultKind
            });
          }} />
        {
          this.state.selectedFaultKind &&
          <Input
            label={this.state.selectedFaultKind}
            name={this.state.selectedFaultKind}
            value={this.formValue[this.state.selectedFaultKind]}
            onChange={value => this.formValue[this.state.selectedFaultKind] = value} />
        }
        <FormGroup label='Impedance'>
          {
            FaultImpedence[this.state.selectedFaultKind].map(kind => (
              <Input
                key={kind}
                label={kind}
                name={kind}
                value={this.state.formValue.impedance[kind]}
                onChange={value => this.formValue.impedance[kind] = value} />
            ))
          }
          <Input
            label='Start Date Time'
            name='startDateTime'
            value={this.state.formValue.startDateTime}
            onChange={value => this.formValue.startDateTime = value} />
          <Input
            label='Stop Date Time'
            name='stopDateTime'
            value={this.state.formValue.stopDateTime}
            onChange={value => this.formValue.stopDateTime = value} />
        </FormGroup>
        <BasicButton
          className='fault-event-form__add-event'
          type='positive'
          label='Add event'
          onClick={() => {
            this.props.onEventAdded(this.formValue);
            this.equipmentTypeSelect.reset();
            this.setState({
              componentOptions: [],
              phaseOptions: [],
              selectedFaultKind: FaultKind.LINE_TO_GROUND
            });
          }} />
      </div>
    );
  }

  normalizePhases(phases: string) {
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? phases : [phases];
  }

  flatten(array: any[][]) {
    const result = [];
    for (const subArray of array)
      result.push(subArray);
    return result;
  }


}