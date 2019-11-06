import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { ModelDictionary } from '@shared/topology/model-dictionary';
import { FormGroup, Select, Option, Input } from '@shared/form';
import { toOptions, removeOptionsWithIdenticalLabel } from '@shared/form/select/utils';
import { FaultEvent, Phase, FaultKind, FaultImpedence } from '@shared/test-manager';
import { Validators } from '@shared/form/validation';
import { ModelDictionaryComponent } from '@shared/topology/model-dictionary/ModelDictionaryComponent';
import { DateTimeService } from '@shared/DateTimeService';

import './FaultEventForm.light.scss';
import './FaultEventForm.dark.scss';

interface Props {
  onEventAdded: (event: FaultEvent) => void;
  initialFormValue: FaultEvent;
  modelDictionary: ModelDictionary;
  componentsWithConsolidatedPhases: ModelDictionaryComponent[];
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

  readonly dateTimeService = DateTimeService.getInstance();

  formValue: FaultEvent;
  equipmentTypeSelect: Select<string, boolean>;

  constructor(props: Props) {
    super(props);
    this.state = {
      equipmentTypeOptions: [
        new Option('ACLineSegment', 'ACLineSegment'),
        new Option('Battery', 'batteries'),
        new Option('Breaker', 'breakers'),
        new Option('Capacitor', 'capacitors'),
        new Option('Disconnector', 'disconnectors'),
        new Option('Fuse', 'fuses'),
        new Option('PowerTransformer', 'PowerTransformer'),
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
          multiple={false}
          ref={comp => this.equipmentTypeSelect = comp}
          label='Equipment Type'
          options={this.state.equipmentTypeOptions}
          onChange={this.onEquipmentTypeChanged} />
        <Select
          multiple={false}
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
          multiple={false}
          label='Phase Connected Fault Kind'
          options={this.state.faultKindOptions}
          isOptionSelected={option => option.value === this.formValue.faultKind}
          onChange={this.onFaultKindChanged} />
        <FormGroup
          label='Impedance'
          collapsible={false}>
          {
            FaultImpedence[this.state.selectedFaultKind].map(kind => (
              <Input
                key={kind}
                label={kind}
                name={kind}
                value={this.state.formValue.FaultImpedance[kind]}
                onChange={value => {
                  this.formValue.FaultImpedance[kind] = value;
                  this._enableAddEventButtonIfFormIsValid();
                }} />
            ))
          }
          <Input
            label='Start Date Time'
            name='startDateTime'
            hint='YYYY-MM-DD HH:MM:SS'
            value={this.dateTimeService.format(this.state.formValue.startDateTime)}
            validators={[
              Validators.checkNotEmpty('Start date time is empty'),
              Validators.checkValidDateTime('Invalid format, YYYY-MM-DD HH:MM:SS expected')
            ]}
            onChange={this.onStartDateTimeChanged} />
          <Input
            label='Stop Date Time'
            hint='YYYY-MM-DD HH:MM:SS'
            name='stopDateTime'
            value={this.dateTimeService.format(this.state.formValue.stopDateTime)}
            validators={[
              Validators.checkNotEmpty('Stop date time is empty'),
              Validators.checkValidDateTime('Invalid format, YYYY-MM-DD HH:MM:SS expected')
            ]}
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

  onEquipmentTypeChanged(option: Option<string>) {
    switch (option.value) {
      case 'ACLineSegment':
      case 'PowerTransformer':
        this.setState({
          componentOptions: toOptions(
            this.props.componentsWithConsolidatedPhases.filter(e => e.conductingEquipmentType === option.value),
            e => `${e.conductingEquipmentName} (${e.phases.join(', ')})`
          ),
          phaseOptions: []
        });
        break;
      default:
        const components = this.props.modelDictionary[option.value] || [];
        this.setState({
          componentOptions: components.map(e => new Option(`${e.name || e.bankName} (${e.phases || e.bankPhases})`, e)),
          phaseOptions: []
        });
        break;
    }
    this.formValue.equipmentType = option.label;
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
      && this.formValue.tag !== ''
      && this.formValue.mRID.length !== 0
      && this.formValue.phases.length !== 0
      && this.formValue.startDateTime !== null
      && this.formValue.stopDateTime !== null
      && (
        this.formValue.faultKind === FaultKind.LINE_TO_GROUND
          ? this.formValue.FaultImpedance.rGround !== '' && this.formValue.FaultImpedance.xGround !== ''
          : this.formValue.faultKind === FaultKind.LINE_TO_LINE
            ? this.formValue.FaultImpedance.rLinetoLine !== '' && this.formValue.FaultImpedance.xLineToLine !== ''
            : this.formValue.FaultImpedance.rGround !== '' && this.formValue.FaultImpedance.xGround !== ''
            && this.formValue.FaultImpedance.rLinetoLine !== '' && this.formValue.FaultImpedance.xLineToLine !== ''
      );
  }

  onComponentChanged(selectedOption: Option<any>) {
    // component: ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch
    const component = selectedOption.value;
    this.setState({
      phaseOptions: removeOptionsWithIdenticalLabel(
        toOptions(
          this._normalizePhases(component.phases || component.bankPhases),
          e => e)
      )
        .map((option, i) => new Option(option.label, { phaseLabel: option.label, phaseIndex: i }))
        .sort((a, b) => a.label.localeCompare(b.label))
    });
    this.formValue.equipmentName = component.conductingEquipmentName || component.name || component.bankName;
    this.formValue.mRID = component.conductingEquipmentMRIDs || component.mRID;
    this._enableAddEventButtonIfFormIsValid();
  }

  private _normalizePhases(phases: string | string[]) {
    if (Array.isArray(phases))
      return phases;
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? [...new Set(phases)] : [phases];
  }

  onPhaseChanged(selectedOptions: Option<Phase>[]) {
    this.formValue.phases = selectedOptions.map(option => option.value);
    this._enableAddEventButtonIfFormIsValid();
  }

  onFaultKindChanged(selectedOption: Option<FaultKind>) {
    this.formValue.faultKind = selectedOption.value;
    this.setState({
      selectedFaultKind: this.formValue.faultKind
    });
  }

  onStartDateTimeChanged(value: string) {
    const parsedDateTime = this.dateTimeService.parse(value);
    this.formValue.startDateTime = parsedDateTime ? parsedDateTime.getTime() / 1000 : null;
    this._enableAddEventButtonIfFormIsValid();
  }

  onStopDateTimeChanged(value: string) {
    const parsedDateTime = this.dateTimeService.parse(value);
    this.formValue.stopDateTime = parsedDateTime ? parsedDateTime.getTime() / 1000 : null;
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
