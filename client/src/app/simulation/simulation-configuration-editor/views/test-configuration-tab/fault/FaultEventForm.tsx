import { Component } from 'react';

import { BasicButton } from '@client:common/buttons';
import { FormGroup, Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@client:common/form';
import { FaultEvent, Phase, FaultKind, FaultImpedanceType, FaultImpedance } from '@client:common/test-manager';
import { Validators } from '@client:common/form/validation';
import { unique } from '@client:common/misc';
import { ModelDictionary, ModelDictionaryRegulator, ModelDictionaryCapacitor, ModelDictionarySwitch } from '@client:common/topology/model-dictionary';
import { ModelDictionaryComponent } from '@client:common/topology/model-dictionary/ModelDictionaryComponent';

import './FaultEventForm.light.scss';
import './FaultEventForm.dark.scss';

interface Props {
  startDateTime: number;
  stopDateTime: number;
  modelDictionary: ModelDictionary;
  modelDictionaryComponents: ModelDictionaryComponent[];
  onAddEvent: (event: FaultEvent) => void;
}

interface State {
  equipmentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  componentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  phaseOptionBuilder: SelectionOptionBuilder<Phase>;
  faultKindOptionBuilder: SelectionOptionBuilder<FaultKind>;
  selectedFaultKind: FaultKind;
}

export class FaultEventForm extends Component<Props, State> {

  readonly equipmentTypeFormControl: FormControlModel<{ id: string; label: string }>;
  readonly componentFormControl: FormControlModel<ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  readonly eventFormGroupModel: FormGroupModel<FaultEvent>;

  faultImpedanceFormGroup: FormGroupModel<FaultImpedance['LineToGround']> | FormGroupModel<FaultImpedance['LineToLine']> | FormGroupModel<FaultImpedance['LineToLineToGround']>;

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
      selectedFaultKind: FaultKind.LINE_TO_GROUND
    };

    this.equipmentTypeFormControl = new FormControlModel(null);
    this.componentFormControl = new FormControlModel(null);
    this.faultImpedanceFormGroup = this._createFaultImpedanceFormGroupModel(FaultKind.LINE_TO_GROUND);
    this.eventFormGroupModel = this._createFormGroupModelForFaultEvent();

    this.componentFormControl.dependsOn(this.equipmentTypeFormControl);
    this.eventFormGroupModel.findControl('phases').dependsOn(this.componentFormControl);

    this.createNewEvent = this.createNewEvent.bind(this);
  }

  private _createFaultImpedanceFormGroupModel(faultKind: FaultKind) {
    switch (faultKind) {
      case FaultKind.LINE_TO_GROUND:
        return new FormGroupModel<FaultImpedance['LineToGround']>({
          rGround: new FormControlModel('', createValidators('rGround')),
          xGround: new FormControlModel('', createValidators('xGround'))
        });
      case FaultKind.LINE_TO_LINE:
        return new FormGroupModel<FaultImpedance['LineToLine']>({
          rLineToLine: new FormControlModel('', createValidators('rLineToLine')),
          xLineToLine: new FormControlModel('', createValidators('xLineToLine'))
        });
      case FaultKind.LINE_TO_LINE_TO_GROUND:
        return new FormGroupModel<FaultImpedance['LineToLineToGround']>({
          rGround: new FormControlModel('', createValidators('rGround')),
          xGround: new FormControlModel('', createValidators('xGround')),
          rLineToLine: new FormControlModel('', createValidators('rLineToLine')),
          xLineToLine: new FormControlModel('', createValidators('xLineToLine'))
        });
    }

    function createValidators(fieldName: string) {
      return [
        Validators.checkNotEmpty(fieldName),
        Validators.checkValidNumber(fieldName)
      ];
    }
  }

  private _createFormGroupModelForFaultEvent() {
    return new FormGroupModel<FaultEvent>({
      // eslint-disable-next-line camelcase
      event_type: 'Fault',
      tag: '',
      equipmentType: '',
      equipmentName: '',
      mRID: null,
      phases: new FormControlModel([]),
      faultKind: new FormControlModel(FaultKind.LINE_TO_GROUND),
      faultImpedance: null,
      startDateTime: new FormControlModel(
        this.props.startDateTime,
        [Validators.checkNotEmpty('Start date time'), Validators.checkValidDateTime('Start date time')]
      ),
      stopDateTime: new FormControlModel(
        this.props.stopDateTime,
        [Validators.checkNotEmpty('Stop date time'), Validators.checkValidDateTime('Stop date time')]
      )
    });
  }

  componentDidMount() {
    this.eventFormGroupModel.validityChanges()
      .subscribe({
        next: () => this.forceUpdate()
      });
    this.faultImpedanceFormGroup.validityChanges()
      .subscribe({
        next: () => {
          this.forceUpdate();
        }
      });
    this._onEquipmentTypeChange();
    this._onComponentSelectionChange();
    this._onFaultKindChange();
  }

  private _onEquipmentTypeChange() {
    this.equipmentTypeFormControl.valueChanges()
      .subscribe({
        next: selectedType => {
          if (selectedType) {
            switch (selectedType.id) {
              case 'ACLineSegment':
              case 'PowerTransformer':
                this.setState({
                  componentOptionBuilder: new SelectionOptionBuilder(
                    this.props.modelDictionaryComponents.filter(e => e.conductingEquipmentType === selectedType.id),
                    e => `${e.conductingEquipmentName} (${e.phases.join(', ')})`
                  ),
                  phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
                });
                break;
              default: {
                const components = this.props.modelDictionary[selectedType.id] || [];
                this.setState({
                  componentOptionBuilder: new SelectionOptionBuilder(
                    components,
                    e => `${'name' in e ? e.name : e.bankName} (${'phases' in e ? e.phases : e.bankPhases})`
                  ),
                  phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
                });
                break;
              }
            }
            this.eventFormGroupModel.setValue({
              equipmentType: selectedType.label
            });
          } else {
            this.setState({
              componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.eventFormGroupModel.setValue({
              equipmentType: ''
            });
          }
        }
      });
  }

  private _onComponentSelectionChange() {
    this.componentFormControl.valueChanges()
      .subscribe({
        next: selectedComponent => {
          if (selectedComponent) {
            this.setState({
              phaseOptionBuilder: new SelectionOptionBuilder(
                unique(this._normalizePhases('phases' in selectedComponent ? selectedComponent.phases : selectedComponent.bankPhases))
                  .sort((a, b) => a.localeCompare(b))
                  .map((phase, i) => ({ phaseLabel: phase, phaseIndex: i })),
                phase => phase.phaseLabel
              )
            });
            this.eventFormGroupModel.setValue({
              equipmentName: 'conductingEquipmentName' in selectedComponent
                ? selectedComponent.conductingEquipmentName
                : 'name' in selectedComponent
                  ? selectedComponent.name
                  : selectedComponent.bankName,
              mRID: 'conductingEquipmentMRIDs' in selectedComponent
                ? selectedComponent.conductingEquipmentMRIDs
                : selectedComponent.mRID
            });
          } else {
            this.setState({
              phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.eventFormGroupModel.setValue({
              equipmentName: '',
              mRID: null
            });
          }
        }
      });
  }

  private _normalizePhases(phases: string | string[]) {
    if (Array.isArray(phases)) {
      return phases;
    }
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? [...new Set(phases)] : [phases];
  }

  private _onFaultKindChange() {
    this.eventFormGroupModel.findControl('faultKind')
      .valueChanges()
      .subscribe({
        next: selectedFaultKind => {
          if (selectedFaultKind) {
            this.faultImpedanceFormGroup.cleanup();
            this.faultImpedanceFormGroup = this._createFaultImpedanceFormGroupModel(selectedFaultKind);
            this.faultImpedanceFormGroup.validityChanges()
              .subscribe({
                next: () => {
                  this.forceUpdate();
                }
              });
            this.setState({
              selectedFaultKind
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.equipmentTypeFormControl.cleanup();
    this.componentFormControl.cleanup();
    this.eventFormGroupModel.cleanup();
    this.faultImpedanceFormGroup.cleanup();
  }

  render() {
    return (
      <div className='fault-event'>
        <Select
          label='Equipment Type'
          selectionOptionBuilder={this.state.equipmentTypeOptionBuilder}
          formControlModel={this.equipmentTypeFormControl} />
        <Select
          label='Name'
          selectionOptionBuilder={this.state.componentOptionBuilder}
          formControlModel={this.componentFormControl} />
        <Select
          label='Phases'
          multiple
          selectionOptionBuilder={this.state.phaseOptionBuilder}
          formControlModel={this.eventFormGroupModel.findControl('phases')} />
        <Select
          label='Phase Connected Fault Kind'
          selectionOptionBuilder={this.state.faultKindOptionBuilder}
          selectedOptionFinder={
            faultKind => faultKind === this.eventFormGroupModel.findControl('faultKind').getValue()
          }
          formControlModel={this.eventFormGroupModel.findControl('faultKind')} />
        <Input
          label='Start Date Time'
          formControlModel={this.eventFormGroupModel.findControl('startDateTime')}
          hint='YYYY-MM-DD HH:MM:SS'
          type='datetime' />
        <Input
          label='Stop Date Time'
          hint='YYYY-MM-DD HH:MM:SS'
          formControlModel={this.eventFormGroupModel.findControl('stopDateTime')}
          type='datetime' />
        <FormGroup
          label='Impedance'
          collapsible={false}>
          {
            FaultImpedanceType[this.state.selectedFaultKind].map(kind => (
              <Input
                key={kind}
                label={kind}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formControlModel={(this.faultImpedanceFormGroup as any).findControl(kind)} />
            ))
          }
        </FormGroup>
        <BasicButton
          className='fault-event-form__add-event'
          disabled={this.eventFormGroupModel.isInvalid() || this.faultImpedanceFormGroup.isInvalid()}
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  createNewEvent() {
    const formValue = this.eventFormGroupModel.getValue();
    formValue.faultImpedance = this.faultImpedanceFormGroup.getValue();
    this.props.onAddEvent(formValue);
    this.eventFormGroupModel.reset();
    this.equipmentTypeFormControl.reset();
    this.faultImpedanceFormGroup.reset();
    this.setState({
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      selectedFaultKind: FaultKind.LINE_TO_GROUND
    });
  }

}
