import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { ModelDictionary } from '@shared/topology/model-dictionary';
import { FormGroup, Select, Option, Input } from '@shared/form';
import { FaultEvent, FaultKind, FaultImpedence } from '../../models/FaultEvent';
import { Phase } from '../../models/Phase';

import './FaultEventForm.scss';

interface Props {
  onEventAdded: (event: FaultEvent) => void;
  initialFormValue: FaultEvent;
  modelDictionary: ModelDictionary;
}

interface State {
  equipmentTypeOptions: Option<string>[];
  componentOptions: Option<any>[];
  phaseOptions: Option<Phase>[];
  faultKindOptions: Option<FaultKind>[];
  selectedFaultKind: FaultKind;
  formValue: FaultEvent;
  addEventButtonDisabled: boolean;
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
      formValue: { ...props.initialFormValue },
      addEventButtonDisabled: true
    };
    this.formValue = this.state.formValue;

    this.onEquipmentTypeChanged = this.onEquipmentTypeChanged.bind(this);
    this.onComponentChanged = this.onComponentChanged.bind(this);
    this.onPhaseChanged = this.onPhaseChanged.bind(this);
    this.onFaultKindChanged = this.onFaultKindChanged.bind(this);
    this.onStartDateTimeChanged = this.onStartDateTimeChanged.bind(this);
    this.onStopDateTimeChanged = this.onStopDateTimeChanged.bind(this);
    this.createNewEvent = this.createNewEvent.bind(this);
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
          onChange={this.onEquipmentTypeChanged} />
        <Select
          label='Name'
          options={this.state.componentOptions}
          onChange={this.onComponentChanged} />
        <Select
          label='Phase'
          multiple
          isOptionSelected={() => this.state.phaseOptions.length === 1}
          options={this.state.phaseOptions}
          onChange={this.onPhaseChanged} />
        <Select
          label='Phase Connected Fault Kind'
          options={this.state.faultKindOptions}
          isOptionSelected={option => option.value === this.formValue.faultKind}
          onChange={this.onFaultKindChanged} />
        <FormGroup label='Impedance'>
          {
            FaultImpedence[this.state.selectedFaultKind].map(kind => (
              <Input
                key={kind}
                label={kind}
                name={kind}
                value={this.state.formValue.impedance[kind]}
                onChange={value => {
                  this.formValue.impedance[kind] = value;
                  this._enableAddEventButtonIfFormIsValid();
                }} />
            ))
          }
          <Input
            label='Start Date Time'
            name='startDateTime'
            value={this.state.formValue.startDateTime}
            onChange={this.onStartDateTimeChanged} />
          <Input
            label='Stop Date Time'
            name='stopDateTime'
            value={this.state.formValue.stopDateTime}
            onChange={this.onStopDateTimeChanged} />
        </FormGroup>
        <BasicButton
          className='fault-event-form__add-event'
          disabled={this.state.addEventButtonDisabled}
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  onEquipmentTypeChanged(selectedOptions: Option<string>[]) {
    const components = this.props.modelDictionary[selectedOptions[0].value] || [];
    this.setState({
      componentOptions: components.map(e => new Option(e.name || e.bankName, e)),
      phaseOptions: []
    });
    this.formValue.equipmentType = selectedOptions[0].label;
    this._enableAddEventButtonIfFormIsValid();
  }

  private _enableAddEventButtonIfFormIsValid() {
    if (this._isFormValueValid())
      this.setState({
        addEventButtonDisabled: false
      });
    else
      this.setState({
        addEventButtonDisabled: true
      });
  }

  private _isFormValueValid(): boolean {
    return this.formValue.equipmentName !== ''
      && this.formValue.equipmentType !== ''
      && this.formValue.id !== ''
      && this.formValue.mRID.length !== 0
      && this.formValue.phases.length !== 0
      && this.formValue.startDateTime !== ''
      && this.formValue.stopDateTime !== ''
      && (
        this.formValue.faultKind === FaultKind.LINE_TO_GROUND
          ? this.formValue.impedance.rGround !== '' && this.formValue.impedance.xGround !== ''
          : this.formValue.faultKind === FaultKind.LINE_TO_LINE
            ? this.formValue.impedance.rLinetoLine !== '' && this.formValue.impedance.xLineToLine !== ''
            : this.formValue.impedance.rGround !== '' && this.formValue.impedance.xGround !== ''
            && this.formValue.impedance.rLinetoLine !== '' && this.formValue.impedance.xLineToLine !== ''
      );
  }

  onComponentChanged(selectedOptions: Option<any>[]) {
    const selectedOption = selectedOptions[0];
    this.setState({
      phaseOptions: this._generateUniqueOptions(
        this._normalizePhases(selectedOption.value.phases || selectedOption.value.bankPhases)
      )
        .map((option, i) => new Option(option.label, { phaseLabel: option.label, phaseIndex: i }))
        .sort((a, b) => a.label.localeCompare(b.label))
    });
    this.formValue.equipmentName = selectedOption.label;
    this.formValue.mRID = selectedOption.value.mRID;
    this._enableAddEventButtonIfFormIsValid();
  }

  private _generateUniqueOptions(iterable: string[] | string): Option[] {
    const result = [];
    for (const element of iterable)
      if (!result.includes(element))
        result.push(new Option(element));
    return result;
  }

  private _normalizePhases(phases: string) {
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? phases : [phases];
  }

  onPhaseChanged(selectedOptions: Option<Phase>[]) {
    this.formValue.phases = selectedOptions.map(option => option.value);
    this._enableAddEventButtonIfFormIsValid();
  }

  onFaultKindChanged(selectedOptions: Option<FaultKind>[]) {
    this.formValue.faultKind = selectedOptions[0].value;
    this.setState({
      selectedFaultKind: this.formValue.faultKind
    });
  }

  onStartDateTimeChanged(value: string) {
    this.formValue.startDateTime = value;
    this._enableAddEventButtonIfFormIsValid();
  }

  onStopDateTimeChanged(value: string) {
    this.formValue.stopDateTime = value;
    this._enableAddEventButtonIfFormIsValid();
  }

  createNewEvent() {
    this.props.onEventAdded(this.formValue);
    this.equipmentTypeSelect.reset();
    this.setState({
      componentOptions: [],
      phaseOptions: [],
      selectedFaultKind: FaultKind.LINE_TO_GROUND,
      addEventButtonDisabled: true
    });
  }

}
