import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { ModelDictionary, ModelDictionaryRegulator, ModelDictionaryCapacitor, ModelDictionarySwitch } from '@shared/topology/model-dictionary';
import { FormGroup, Select, Input, SelectionOptionBuilder } from '@shared/form';
import { FaultEvent, Phase, FaultKind, FaultImpedence } from '@shared/test-manager';
import { Validators } from '@shared/form/validation';
import { ModelDictionaryComponent } from '@shared/topology/model-dictionary/ModelDictionaryComponent';
import { DateTimeService } from '@shared/DateTimeService';
import { unique } from '@shared/misc';

import './FaultEventForm.light.scss';
import './FaultEventForm.dark.scss';

interface Props {
  onEventAdded: (event: FaultEvent) => void;
  initialFormValue: FaultEvent;
  modelDictionary: ModelDictionary;
  componentsWithConsolidatedPhases: ModelDictionaryComponent[];
}

interface State {
  equipmentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string; }>;
  componentOptionBuilder: SelectionOptionBuilder<any>;
  phaseOptionBuilder: SelectionOptionBuilder<Phase>;
  faultKindOptionBuilder: SelectionOptionBuilder<FaultKind>;
  selectedFaultKind: FaultKind;
  formValue: FaultEvent;
  addEventButtonDisabled: boolean;
}

export class FaultEventForm extends React.Component<Props, State> {

  readonly dateTimeService = DateTimeService.getInstance();

  formValue: FaultEvent;
  equipmentTypeSelect: Select<any, any>;

  constructor(props: Props) {
    super(props);
    this.state = {
      equipmentTypeOptionBuilder: new SelectionOptionBuilder(
        [
          { label: 'ACLineSegment', id: 'ACLineSegment' },
          { label: 'Battery', id: 'batteries' },
          { label: 'Breaker', id: 'breakers' },
          { label: 'Capacitor', id: 'capacitors' },
          { label: 'Disconnector', id: 'disconnectors' },
          { label: 'Fuse', id: 'fuses' },
          { label: 'PowerTransformer', id: 'PowerTransformer' },
          { label: 'Recloser', id: 'reclosers' },
          { label: 'Regulator', id: 'regulators' },
          { label: 'Sectionaliser', id: 'sectionalisers' },
          { label: 'Solar Panel', id: 'solarpanels' },
          { label: 'Switch', id: 'switches' },
          { label: 'Synchronous Machine', id: 'synchronousmachines' }
        ],
        type => type.label
      ),
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      faultKindOptionBuilder: new SelectionOptionBuilder(
        [
          FaultKind.LINE_TO_GROUND,
          FaultKind.LINE_TO_LINE,
          FaultKind.LINE_TO_LINE_TO_GROUND
        ]
      ),
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
          selectionOptionBuilder={this.state.equipmentTypeOptionBuilder}
          onChange={this.onEquipmentTypeChanged} />
        <Select
          label='Name'
          selectionOptionBuilder={this.state.componentOptionBuilder}
          onChange={this.onComponentChanged} />
        <Select
          label='Phase'
          multiple
          selectedOptionFinder={() => this.state.phaseOptionBuilder.numberOfOptions() === 1}
          selectionOptionBuilder={this.state.phaseOptionBuilder}
          onChange={this.onPhaseChanged} />
        <Select
          label='Phase Connected Fault Kind'
          selectionOptionBuilder={this.state.faultKindOptionBuilder}
          selectedOptionFinder={faultKind => faultKind === this.formValue.faultKind}
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

  onEquipmentTypeChanged(selectedType: { id: string; label: string; }) {
    switch (selectedType.id) {
      case 'ACLineSegment':
      case 'PowerTransformer':
        this.setState({
          componentOptionBuilder: new SelectionOptionBuilder(
            this.props.componentsWithConsolidatedPhases.filter(e => e.conductingEquipmentType === selectedType.id),
            e => `${e.conductingEquipmentName} (${e.phases.join(', ')})`
          ),
          phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
        });
        break;
      default:
        const components = this.props.modelDictionary[selectedType.id] || [];
        this.setState({
          componentOptionBuilder: new SelectionOptionBuilder(
            components,
            e => `${e.name || e.bankName} (${e.phases || e.bankPhases})`
          ),
          phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
        });
        break;
    }
    this.formValue.equipmentType = selectedType.id;
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

  onComponentChanged(selectedComponent: ModelDictionaryComponent & ModelDictionaryRegulator & ModelDictionaryCapacitor & ModelDictionarySwitch) {
    // component: ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch
    this.setState({
      phaseOptionBuilder: new SelectionOptionBuilder(
        unique(this._normalizePhases(selectedComponent.phases || selectedComponent.bankPhases))
          .sort((a, b) => a.localeCompare(b))
          .map((phase, i) => ({ phaseLabel: phase, phaseIndex: i })),
        phase => phase.phaseLabel
      )
    });
    this.formValue.equipmentName = selectedComponent.conductingEquipmentName ||
      selectedComponent.name ||
      selectedComponent.bankName;
    this.formValue.mRID = selectedComponent.conductingEquipmentMRIDs || selectedComponent.mRID;
    this._enableAddEventButtonIfFormIsValid();
  }

  private _normalizePhases(phases: string | string[]) {
    if (Array.isArray(phases))
      return phases;
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? [...new Set(phases)] : [phases];
  }

  onPhaseChanged(selectedPhases: Phase[]) {
    this.formValue.phases = selectedPhases;
    this._enableAddEventButtonIfFormIsValid();
  }

  onFaultKindChanged(selectedFaultKind: FaultKind) {
    this.formValue.faultKind = selectedFaultKind;
    this.setState({
      selectedFaultKind: this.formValue.faultKind
    });
  }

  onStartDateTimeChanged(value: string) {
    this.formValue.startDateTime = this.dateTimeService.parse(value);
    this._enableAddEventButtonIfFormIsValid();
  }

  onStopDateTimeChanged(value: string) {
    this.formValue.stopDateTime = this.dateTimeService.parse(value);
    this._enableAddEventButtonIfFormIsValid();
  }

  createNewEvent() {
    this.props.onEventAdded(this.formValue);
    this.equipmentTypeSelect.reset();
    this.setState({
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      selectedFaultKind: FaultKind.LINE_TO_GROUND,
      addEventButtonDisabled: true
    });
  }

}
