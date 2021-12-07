import { Component } from 'react';

import { BasicButton, IconButton } from '@client:common/buttons';
import {
  FormGroup,
  Checkbox,
  Select,
  Input,
  SelectionOptionBuilder,
  FormGroupModel,
  FormControlModel
} from '@client:common/form';
import { Tooltip } from '@client:common/tooltip';
import { CommOutageEvent, Phase, CommOutageEventInputListItem, CommOutageEventOutputListItem } from '@client:common/test-manager';
import { Validators } from '@client:common/form/validation';
import { unique } from '@client:common/misc';
import { ModelDictionary, ModelDictionaryMeasurement, ModelDictionaryRegulator, ModelDictionaryCapacitor, ModelDictionarySwitch, MeasurementType } from '@client:common/topology/model-dictionary';

import { COMPONENT_ATTRIBUTES } from '../../../models/component-attributes';

import './CommOutageEventForm.light.scss';
import './CommOutageEventForm.dark.scss';

let outputEquipmentTypeOptionBuilder: SelectionOptionBuilder<string>;
let previousModelDictionary: ModelDictionary;

interface Props {
  modelDictionary: ModelDictionary;
  startDateTime: number;
  stopDateTime: number;
  onAddEvent: (event: CommOutageEvent) => void;
}

interface State {
  inputEquipmentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  inputComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryCapacitor | ModelDictionaryRegulator | ModelDictionarySwitch>;
  inputPhaseOptionBuilder: SelectionOptionBuilder<Phase>;
  inputAttributeOptionBuilder: SelectionOptionBuilder<string>;
  outputEquipmentTypeOptionBuilder: SelectionOptionBuilder<string>;
  outputComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryMeasurement>;
  outputPhaseOptionBuilder: SelectionOptionBuilder<string>;
  outputMeasurementTypeOptionBuilder: SelectionOptionBuilder<MeasurementType>;
  disableAddInputItemButton: boolean;
  disableAddOutputItemButton: boolean;
  inputList: CommOutageEventInputListItem[];
  outputList: CommOutageEventOutputListItem[];
}

export class CommOutageEventForm extends Component<Props, State> {

  readonly selectedTypeForCurrentInputItemFormControl = new FormControlModel<{ id: string; label: string }>(null);
  readonly selectedComponentForCurrentInputItemFormControl = new FormControlModel<ModelDictionaryCapacitor | ModelDictionaryRegulator | ModelDictionarySwitch>(null);
  readonly selectedComponentForCurrentOutputItemFormControl = new FormControlModel<ModelDictionaryMeasurement>(null);
  readonly currentEventFormGroup: FormGroupModel<CommOutageEvent>;
  readonly currentInputItemFormGroup: FormGroupModel<CommOutageEventInputListItem>;
  readonly currentOutputItemFormGroup: FormGroupModel<CommOutageEventOutputListItem>;

  constructor(props: Props) {
    super(props);

    if (previousModelDictionary !== props.modelDictionary) {
      outputEquipmentTypeOptionBuilder = new SelectionOptionBuilder(
        unique(props.modelDictionary.measurements.map(e => e.ConductingEquipment_type))
      );
      previousModelDictionary = props.modelDictionary;
    }

    this.state = {
      inputEquipmentTypeOptionBuilder: new SelectionOptionBuilder(
        [
          { id: 'batteries', label: 'Battery' },
          { id: 'breakers', label: 'Breaker' },
          { id: 'capacitors', label: 'Capacitor' },
          { id: 'disconnectors', label: 'Disconnector' },
          { id: 'fuses', label: 'Fuse' },
          { id: 'reclosers', label: 'Recloser' },
          { id: 'regulators', label: 'Regulator' },
          { id: 'sectionalisers', label: 'Sectionaliser' },
          { id: 'solarpanels', label: 'Solar Panel' },
          { id: 'switches', label: 'Switch' },
          { id: 'synchronousmachines', label: 'Synchronous Machine' }
        ],
        type => type.label
      ),
      inputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputAttributeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputEquipmentTypeOptionBuilder,
      outputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      disableAddInputItemButton: true,
      disableAddOutputItemButton: true,
      inputList: [],
      outputList: []
    };

    this.currentInputItemFormGroup = this._createFormGroupModelForInputListItem();
    this.currentOutputItemFormGroup = this._createFormGroupModelForOutputListItem();
    this.currentEventFormGroup = this._createFormGroupModelForEvent();

    this.addNewInputItem = this.addNewInputItem.bind(this);
    this.addNewOutputItem = this.addNewOutputItem.bind(this);
    this.createNewEvent = this.createNewEvent.bind(this);
  }

  private _createFormGroupModelForEvent() {
    return new FormGroupModel<CommOutageEvent>({
      // eslint-disable-next-line camelcase
      event_type: 'CommOutage',
      tag: '',
      startDateTime: new FormControlModel(
        this.props.startDateTime,
        [Validators.checkNotEmpty('Start date time'), Validators.checkValidDateTime('Start date time')]
      ),
      stopDateTime: new FormControlModel(
        this.props.stopDateTime,
        [Validators.checkNotEmpty('Stop date time'), Validators.checkValidDateTime('Stop date time')]
      ),
      allInputOutage: new FormControlModel(false),
      inputList: [],
      allOutputOutage: new FormControlModel(false),
      outputList: []
    });
  }

  private _createFormGroupModelForInputListItem() {
    const formGroup = new FormGroupModel<CommOutageEventInputListItem>({
      name: '',
      type: '',
      mRID: '',
      phases: new FormControlModel([]),
      attribute: new FormControlModel('')
    });
    this.selectedComponentForCurrentInputItemFormControl.dependsOn(this.selectedTypeForCurrentInputItemFormControl);
    formGroup.findControl('phases').dependsOn(this.selectedComponentForCurrentInputItemFormControl);
    formGroup.findControl('attribute').dependsOn(this.selectedTypeForCurrentInputItemFormControl);
    return formGroup;
  }

  private _createFormGroupModelForOutputListItem() {
    const formGroup = new FormGroupModel<CommOutageEventOutputListItem>({
      name: '',
      type: new FormControlModel(''),
      mRID: '',
      phases: new FormControlModel([]),
      measurementTypes: new FormControlModel([])
    });
    this.selectedComponentForCurrentOutputItemFormControl.dependsOn(formGroup.findControl('type'));
    formGroup.findControl('phases').dependsOn(this.selectedComponentForCurrentOutputItemFormControl);
    formGroup.findControl('measurementTypes').dependsOn(this.selectedComponentForCurrentOutputItemFormControl);
    return formGroup;
  }

  componentDidMount() {
    this._updateUiOnFormControlValidityChanges();
    this._toggleInputListEditabilityOnAllInputCheckboxChange();
    this._populateInputComponentSelectionOnInputEquipmentTypeChange();
    this._onInputComponentChange();
    this._toggleOutputListEditabilityOnAllInputCheckBoxChange();
    this._populateOutputComponentSelectionOnOutputEquipmentTypeChange();
    this._onOutputComponentChange();
  }

  private _updateUiOnFormControlValidityChanges() {
    this.currentInputItemFormGroup.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableAddInputItemButton: !isValid
          });
        }
      });
    this.currentOutputItemFormGroup.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableAddOutputItemButton: !isValid
          });
        }
      });
  }

  shouldDisableAddEventButton(): boolean {
    if (this.currentEventFormGroup.findControl('allInputOutage').getValue() === false) {
      return (
        this.state.inputList.length === 0
        ||
        this.currentInputItemFormGroup.isInvalid() && !this.currentInputItemFormGroup.isPristine()
      );
    }
    if (!this.currentOutputItemFormGroup.isPristine() && this.currentOutputItemFormGroup.isInvalid()) {
      return true;
    }
    if (this.state.outputList.length === 0 && this.currentOutputItemFormGroup.isValid()) {
      return true;
    }
    return false;
  }

  private _toggleInputListEditabilityOnAllInputCheckboxChange() {
    this.currentEventFormGroup.findControl('allInputOutage')
      .valueChanges()
      .subscribe({
        next: isChecked => {
          this.selectedTypeForCurrentInputItemFormControl.reset();
          if (isChecked) {
            this.selectedTypeForCurrentInputItemFormControl.disable();
            this.setState({
              disableAddInputItemButton: true,
              inputList: []
            });
          } else {
            this.selectedTypeForCurrentInputItemFormControl.enable();
          }
        }
      });
  }

  private _populateInputComponentSelectionOnInputEquipmentTypeChange() {
    this.selectedTypeForCurrentInputItemFormControl.valueChanges()
      .subscribe({
        next: selectedType => {
          if (selectedType) {
            this.setState({
              inputComponentOptionBuilder: new SelectionOptionBuilder(
                this.props.modelDictionary[selectedType.id] || [],
                e => 'name' in e ? e.name : e.bankName
              ),
              inputAttributeOptionBuilder: new SelectionOptionBuilder(
                COMPONENT_ATTRIBUTES[selectedType.id] || []
              ),
              inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.currentInputItemFormGroup.setValue({
              type: selectedType.label
            });
          } else {
            this.setState({
              inputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              inputAttributeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  private _onInputComponentChange() {
    this.selectedComponentForCurrentInputItemFormControl.valueChanges()
      .subscribe({
        next: selectedComponent => {
          if (selectedComponent) {
            this.setState({
              inputPhaseOptionBuilder: new SelectionOptionBuilder(
                unique(this._normalizePhases('phases' in selectedComponent ? selectedComponent.phases : selectedComponent.bankPhases))
                  .sort((a, b) => a.localeCompare(b))
                  .map((phase, i) => ({ phaseLabel: phase, phaseIndex: i })),
                phase => phase.phaseLabel
              )
            });
            this.currentInputItemFormGroup.setValue({
              name: 'name' in selectedComponent ? selectedComponent.name : selectedComponent.bankName,
              mRID: selectedComponent.mRID
            });
          } else {
            this.setState({
              inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.currentInputItemFormGroup.setValue({
              name: '',
              mRID: ''
            });
          }
        }
      });
  }

  private _normalizePhases(phases: string) {
    // If phases is a string containing either A or B or C,
    // then return it as is
    return /^[abc]+$/i.test(phases) ? phases : [phases];
  }

  private _toggleOutputListEditabilityOnAllInputCheckBoxChange() {
    this.currentEventFormGroup.findControl('allOutputOutage')
      .valueChanges()
      .subscribe({
        next: isChecked => {
          if (isChecked) {
            this.currentOutputItemFormGroup.reset();
            this.currentOutputItemFormGroup.disable();
            this.setState({
              disableAddOutputItemButton: true,
              outputList: []
            });
          } else {
            this.currentOutputItemFormGroup.findControl('type').enable();
          }
        }
      });
  }

  private _populateOutputComponentSelectionOnOutputEquipmentTypeChange() {
    this.currentOutputItemFormGroup.findControl('type')
      .valueChanges()
      .subscribe({
        next: selectedType => {
          if (selectedType) {
            this.setState({
              outputComponentOptionBuilder: new SelectionOptionBuilder(
                this.props.modelDictionary.measurements.filter(
                  e => e.ConductingEquipment_type === selectedType
                ),
                measurement => `${measurement.ConductingEquipment_name} (${measurement.phases})`
              )
            });
          } else {
            this.setState({
              outputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
          this.setState({
            outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
            outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
          });
        }
      });
  }

  private _onOutputComponentChange() {
    this.selectedComponentForCurrentOutputItemFormControl.valueChanges()
      .subscribe({
        next: selectedComponent => {
          if (selectedComponent) {
            this.setState({
              outputPhaseOptionBuilder: new SelectionOptionBuilder(
                unique(this._normalizePhases(selectedComponent.phases)).sort((a, b) => a.localeCompare(b))
              ),
              outputMeasurementTypeOptionBuilder: new SelectionOptionBuilder(
                [selectedComponent.measurementType]
              )
            });
            this.currentOutputItemFormGroup.setValue({
              name: selectedComponent.ConductingEquipment_name,
              mRID: selectedComponent.ConductingEquipment_mRID
            });
          } else {
            this.setState({
              outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.currentOutputItemFormGroup.setValue({
              name: '',
              mRID: ''
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.selectedTypeForCurrentInputItemFormControl.cleanup();
    this.selectedComponentForCurrentInputItemFormControl.cleanup();
    this.selectedComponentForCurrentOutputItemFormControl.cleanup();
    this.currentOutputItemFormGroup.cleanup();
    this.currentEventFormGroup.cleanup();
  }

  render() {
    return (
      <div className='comm-outage-event'>
        <Input
          label='Start Date Time'
          hint='YYYY-MM-DD HH:MM:SS'
          type='datetime'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formControlModel={this.currentEventFormGroup.findControl('startDateTime') as any} />
        <Input
          label='Stop Date Time'
          type='datetime'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formControlModel={this.currentEventFormGroup.findControl('stopDateTime') as any} />
        <FormGroup
          label='Input Outage List'
          collapsible={false}>
          <Checkbox
            label='All Input Outage'
            name='allInputOutage'
            formControlModel={this.currentEventFormGroup.findControl('allInputOutage')} />
          <Select
            label='Equipment Type'
            formControlModel={this.selectedTypeForCurrentInputItemFormControl}
            selectionOptionBuilder={this.state.inputEquipmentTypeOptionBuilder} />
          <Select
            label='Name'
            formControlModel={this.selectedComponentForCurrentInputItemFormControl}
            selectionOptionBuilder={this.state.inputComponentOptionBuilder} />
          <Select
            multiple
            label='Phases'
            formControlModel={this.currentInputItemFormGroup.findControl('phases')}
            selectionOptionBuilder={this.state.inputPhaseOptionBuilder} />
          <Select
            label='Attribute'
            formControlModel={this.currentInputItemFormGroup.findControl('attribute')}
            selectionOptionBuilder={this.state.inputAttributeOptionBuilder} />
          <Tooltip
            content='Add input item'
            position='right'>
            <IconButton
              disabled={this.state.disableAddInputItemButton}
              className='comm-outage-event-form__add-input'
              icon='add'
              onClick={this.addNewInputItem} />
          </Tooltip>
          {
            this.state.inputList.length > 0
            &&
            <table className='comm-outage-event-form__input-output-list'>
              <thead>
                <tr>
                  <th></th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Phases</th>
                  <th>Attribute</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.inputList.map((inputItem, index) => (
                    <tr key={index}>
                      <td>
                        <Tooltip content='Delete'>
                          <IconButton
                            style='accent'
                            size='small'
                            icon='delete'
                            onClick={() => {
                              this.setState({
                                inputList: this.state.inputList.filter(item => item !== inputItem)
                              });
                            }} />
                        </Tooltip>
                      </td>
                      <td>
                        <div>
                          {inputItem.type}
                        </div>
                      </td>
                      <td>
                        <div>
                          {inputItem.name}
                        </div>
                      </td>
                      <td>
                        <div>
                          {inputItem.phases.map(phase => phase.phaseLabel).join(', ')}
                        </div>
                      </td>
                      <td>
                        <div>{inputItem.attribute}</div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          }
        </FormGroup>
        <FormGroup
          label='Output Outage List'
          collapsible={false}>
          <Checkbox
            label='All Ouput Outage'
            name='allOutputOutage'
            formControlModel={this.currentEventFormGroup.findControl('allOutputOutage')} />
          <Select
            label='Equipment Type'
            formControlModel={this.currentOutputItemFormGroup.findControl('type')}
            selectionOptionBuilder={this.state.outputEquipmentTypeOptionBuilder} />
          <Select
            label='Equipment Name'
            formControlModel={this.selectedComponentForCurrentOutputItemFormControl}
            selectionOptionBuilder={this.state.outputComponentOptionBuilder} />
          <Select
            multiple
            label='Phases'
            formControlModel={this.currentOutputItemFormGroup.findControl('phases')}
            selectionOptionBuilder={this.state.outputPhaseOptionBuilder} />
          <Select
            multiple
            label='Measurement Type'
            formControlModel={this.currentOutputItemFormGroup.findControl('measurementTypes')}
            selectionOptionBuilder={this.state.outputMeasurementTypeOptionBuilder} />
          <Tooltip
            content='Add output item'
            position='right'>
            <IconButton
              disabled={this.state.disableAddOutputItemButton}
              className='comm-outage-event-form__add-output'
              icon='add'
              onClick={this.addNewOutputItem} />
          </Tooltip>
          {
            this.state.outputList.length > 0
            &&
            <table className='comm-outage-event-form__input-output-list'>
              <thead>
                <tr>
                  <th></th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Phases</th>
                  <th>Measurement type</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.outputList.map((outputItem, index) => (
                    <tr key={index}>
                      <td>
                        <Tooltip content='Delete'>
                          <IconButton
                            style='accent'
                            size='small'
                            icon='delete'
                            onClick={() => {
                              this.setState({
                                outputList: this.state.outputList.filter(item => item !== outputItem)
                              });
                            }} />
                        </Tooltip>
                      </td>
                      <td>
                        <div>
                          {outputItem.type}
                        </div>
                      </td>
                      <td>
                        <div>
                          {outputItem.name}
                        </div>
                      </td>
                      <td>
                        <div>
                          {outputItem.phases.join(', ')}
                        </div>
                      </td>
                      <td>
                        <div>
                          {outputItem.measurementTypes.map((e, i) => <div key={i}>{e}</div>)}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          }
        </FormGroup>
        <BasicButton
          disabled={this.shouldDisableAddEventButton()}
          className='comm-outage-event-form__add-event'
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  addNewInputItem() {
    const inputItem = this.currentInputItemFormGroup.getValue();
    inputItem.phases.sort((a, b) => a.phaseLabel.localeCompare(b.phaseLabel));
    this.currentInputItemFormGroup.reset();
    this.selectedTypeForCurrentInputItemFormControl.reset();
    this.setState({
      inputList: [...this.state.inputList, inputItem]
    });
  }

  addNewOutputItem() {
    const outputItem = this.currentOutputItemFormGroup.getValue();
    outputItem.phases.sort();
    this.setState({
      outputList: [...this.state.outputList, outputItem]
    });
    this.selectedComponentForCurrentOutputItemFormControl.reset();
    this.currentOutputItemFormGroup.reset();
  }

  createNewEvent() {
    const formValue = this.currentEventFormGroup.getValue();
    formValue.inputList = this.state.inputList;
    formValue.outputList = this.state.outputList;
    this.props.onAddEvent(formValue);
    this.currentEventFormGroup.reset();
    this.selectedTypeForCurrentInputItemFormControl.reset();
    this.currentOutputItemFormGroup.findControl('type').reset();
    this.setState({
      disableAddInputItemButton: true,
      disableAddOutputItemButton: true,
      inputList: [],
      outputList: []
    });
  }

}
