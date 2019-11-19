import * as React from 'react';

import { BasicButton, IconButton } from '@shared/buttons';
import { ModelDictionary, ModelDictionaryMeasurement } from '@shared/topology/model-dictionary';
import { FormGroup, CheckBox, Select, Input, SelectionOptionBuilder } from '@shared/form';
import { COMPONENT_ATTRIBUTES } from '../../../models/component-attributes';
import { Tooltip } from '@shared/tooltip';
import { CommOutageEvent, Phase, CommOutageEventInputListItem, CommOutageEventOutputListItem } from '@shared/test-manager';
import { Validators } from '@shared/form/validation';
import { DateTimeService } from '@shared/DateTimeService';
import { unique } from '@shared/misc';

import './CommOutageEventForm.light.scss';
import './CommOutageEventForm.dark.scss';

let outputEquipmentTypeOptionBuilder: SelectionOptionBuilder<string>;
let previousModelDictionary: ModelDictionary;
const inputEquipmentTypeOptionBuilder = new SelectionOptionBuilder(
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
);

interface Props {
  onEventAdded: (event: CommOutageEvent) => void;
  initialFormValue: CommOutageEvent;
  modelDictionary: ModelDictionary;
}

interface State {
  inputEquipmentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  inputComponentOptionBuilder: SelectionOptionBuilder<any>;
  inputPhaseOptionBuilder: SelectionOptionBuilder<Phase>;
  inputAttributeBuilder: SelectionOptionBuilder<string>;
  outputEquipmentTypeOptionBuilder: SelectionOptionBuilder<string>;
  outputComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryMeasurement>;
  outputPhaseOptionBuilder: SelectionOptionBuilder<string>;
  outputMeasurementTypeOptionBuilder: SelectionOptionBuilder<any>;
  inputList: CommOutageEventInputListItem[];
  outputList: CommOutageEventOutputListItem[];
  addInputItemButtonDisabled: boolean;
  addOutputItemButtonDisabled: boolean;
  allInputOutageChecked: boolean;
  allOutputOutageChecked: boolean;
}

export class CommOutageEventForm extends React.Component<Props, State> {

  readonly dateTimeService = DateTimeService.getInstance();

  formValue: CommOutageEvent;
  currentInputListItem: CommOutageEventInputListItem;
  currentOutputListItem: CommOutageEventOutputListItem;
  inputComponentTypeSelect: Select<any, any>;
  outputComponentTypeSelect: Select<string, boolean>;

  constructor(props: Props) {
    super(props);

    if (previousModelDictionary !== props.modelDictionary) {
      outputEquipmentTypeOptionBuilder = new SelectionOptionBuilder(
        unique(props.modelDictionary.measurements.map(e => e.ConductingEquipment_type))
      );
      previousModelDictionary = props.modelDictionary;
    }

    this.state = {
      inputEquipmentTypeOptionBuilder: inputEquipmentTypeOptionBuilder,
      inputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputAttributeBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputEquipmentTypeOptionBuilder: outputEquipmentTypeOptionBuilder,
      outputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputList: [],
      outputList: [],
      addInputItemButtonDisabled: true,
      addOutputItemButtonDisabled: true,
      allInputOutageChecked: props.initialFormValue.allInputOutage,
      allOutputOutageChecked: props.initialFormValue.allOutputOutage
    };

    this.formValue = { ...props.initialFormValue };
    this.currentInputListItem = this._newInputListItem();
    this.currentOutputListItem = this._newOutputListItem();

    this.onAllInputOutageCheckboxToggled = this.onAllInputOutageCheckboxToggled.bind(this);
    this.onInputEquipmentTypeChanged = this.onInputEquipmentTypeChanged.bind(this);
    this.onInputComponentChanged = this.onInputComponentChanged.bind(this);
    this.onInputPhasesChanged = this.onInputPhasesChanged.bind(this);
    this.onInputAttributeChanged = this.onInputAttributeChanged.bind(this);
    this.addNewInputItem = this.addNewInputItem.bind(this);
    this.onAllOutputOutageCheckBoxToggled = this.onAllOutputOutageCheckBoxToggled.bind(this);
    this.onOuputEquipmentTypeChanged = this.onOuputEquipmentTypeChanged.bind(this);
    this.onOutputComponentChanged = this.onOutputComponentChanged.bind(this);
    this.onOutputPhasesChanged = this.onOutputPhasesChanged.bind(this);
    this.onOutputMeasurementTypesChanged = this.onOutputMeasurementTypesChanged.bind(this);
    this.onStartDateTimeChanged = this.onStartDateTimeChanged.bind(this);
    this.onStopDateTimeChanged = this.onStopDateTimeChanged.bind(this);
    this.addNewOutputItem = this.addNewOutputItem.bind(this);
    this.createNewEvent = this.createNewEvent.bind(this);
  }

  private _newInputListItem(): CommOutageEventInputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      attribute: ''
    };
  }

  private _newOutputListItem(): CommOutageEventOutputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      measurementTypes: []
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.initialFormValue !== prevProps.initialFormValue)
      this.formValue = { ...this.props.initialFormValue };
  }

  render() {
    return (
      <div className='comm-outage-event'>
        <FormGroup
          label='Input Outage List'
          collapsible={false}>
          <CheckBox
            label='All Input Outage'
            name='allInputOutage'
            checked={this.state.allInputOutageChecked}
            onChange={this.onAllInputOutageCheckboxToggled} />
          <Select
            ref={comp => this.inputComponentTypeSelect = comp}
            label='Equipment Type'
            selectionOptionBuilder={this.state.inputEquipmentTypeOptionBuilder}
            onChange={this.onInputEquipmentTypeChanged} />
          <Select
            label='Name'
            selectionOptionBuilder={this.state.inputComponentOptionBuilder}
            onChange={this.onInputComponentChanged} />
          <Select
            label='Phase'
            multiple
            selectionOptionBuilder={this.state.inputPhaseOptionBuilder}
            selectedOptionFinder={() => this.state.inputPhaseOptionBuilder.numberOfOptions() === 1}
            onChange={this.onInputPhasesChanged} />
          <Select
            label='Attribute'
            selectionOptionBuilder={this.state.inputAttributeBuilder}
            onChange={this.onInputAttributeChanged} />
          <Tooltip
            content='Add input item'
            position='right'>
            <IconButton
              disabled={this.state.addInputItemButtonDisabled}
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
                            onClick={() => this.setState({ inputList: this.state.inputList.filter(item => item !== inputItem) })} />
                        </Tooltip>
                      </td>
                      <td>{inputItem.type}</td>
                      <td>{inputItem.name}</td>
                      <td>{inputItem.phases.map((phase, i) => <div key={i}>{phase.phaseLabel}</div>)}</td>
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
          <CheckBox
            label='All Ouput Outage'
            name='allOutputOutage'
            checked={this.state.allOutputOutageChecked}
            onChange={this.onAllOutputOutageCheckBoxToggled} />
          <Select
            ref={comp => this.outputComponentTypeSelect = comp}
            label='Equipment Type'
            selectionOptionBuilder={this.state.outputEquipmentTypeOptionBuilder}
            onChange={this.onOuputEquipmentTypeChanged} />
          <Select
            label='Equipment Name'
            selectionOptionBuilder={this.state.outputComponentOptionBuilder}
            onChange={this.onOutputComponentChanged} />
          <Select
            label='Phase'
            multiple
            selectionOptionBuilder={this.state.outputPhaseOptionBuilder}
            selectedOptionFinder={() => this.state.outputPhaseOptionBuilder.numberOfOptions() === 1}
            onChange={this.onOutputPhasesChanged} />
          <Select
            multiple
            label='Measurement Type'
            selectionOptionBuilder={this.state.outputMeasurementTypeOptionBuilder}
            selectedOptionFinder={() => this.state.outputMeasurementTypeOptionBuilder.numberOfOptions() === 1}
            onChange={this.onOutputMeasurementTypesChanged} />
          <Input
            label='Start Date Time'
            name='startDateTime'
            hint='YYYY-MM-DD HH:MM:SS'
            value={this.dateTimeService.format(this.formValue.startDateTime)}
            validators={[
              Validators.checkNotEmpty('Start date time is empty'),
              Validators.checkValidDateTime('Invalid format, YYYY-MM-DD HH:MM:SS expected')
            ]}
            onChange={this.onStartDateTimeChanged} />
          <Input
            label='Stop Date Time'
            name='stopDateTime'
            hint='YYYY-MM-DD HH:MM:SS'
            value={this.dateTimeService.format(this.formValue.stopDateTime)}
            validators={[
              Validators.checkNotEmpty('Stop date time is empty'),
              Validators.checkValidDateTime('Invalid format, YYYY-MM-DD HH:MM:SS expected')
            ]}
            onChange={this.onStopDateTimeChanged} />
          <Tooltip
            content='Add output item'
            position='right'>
            <IconButton
              disabled={this.state.addOutputItemButtonDisabled}
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
                            onClick={() => this.setState({ outputList: this.state.outputList.filter(item => item !== outputItem) })} />
                        </Tooltip>
                      </td>
                      <td>{outputItem.type}</td>
                      <td>{outputItem.name}</td>
                      <td>{outputItem.phases.map((e, i) => <div key={i}>{e}</div>)}</td>
                      <td>{outputItem.measurementTypes.map((e, i) => <div key={i}>{e}</div>)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          }
        </FormGroup>
        <BasicButton
          disabled={this.disableAddEventButton()}
          className='comm-outage-event-form__add-event'
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  onAllInputOutageCheckboxToggled(state: boolean) {
    this.formValue.allInputOutage = state;
    if (state)
      this.setState({
        inputEquipmentTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
        inputList: [],
        allInputOutageChecked: true
      });
    else
      this.setState({
        inputEquipmentTypeOptionBuilder: inputEquipmentTypeOptionBuilder,
        allInputOutageChecked: false
      });
  }

  onInputEquipmentTypeChanged(selectedType: { id: string; label: string }) {
    this.setState({
      inputComponentOptionBuilder: new SelectionOptionBuilder(
        this.props.modelDictionary[selectedType.id] || [],
        e => e.name || e.bankName
      ),
      inputAttributeBuilder: new SelectionOptionBuilder(
        COMPONENT_ATTRIBUTES[selectedType.id] || []
      ),
      inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
    this.currentInputListItem = this._newInputListItem();
    this.currentInputListItem.type = selectedType.label;
    this._enableOrDisableAddInputItemButton();
  }

  private _enableOrDisableAddInputItemButton() {
    if (
      this.currentInputListItem.name !== '' &&
      this.currentInputListItem.type !== '' &&
      this.currentInputListItem.phases.length > 0 &&
      this.currentInputListItem.attribute.length > 0
    )
      this.setState({
        addInputItemButtonDisabled: false
      });
    else
      this.setState({
        addInputItemButtonDisabled: true
      });
  }

  onInputComponentChanged(selectedComponent: any) {
    this.setState({
      inputPhaseOptionBuilder: new SelectionOptionBuilder(
        unique(this._normalizePhases(selectedComponent.phases || selectedComponent.bankPhases))
          .sort((a, b) => a.localeCompare(b))
          .map((phase, i) => ({ phaseLabel: phase, phaseIndex: i })),
        phase => phase.phaseLabel
      )
    });
    this.currentInputListItem.name = selectedComponent.name || selectedComponent.bankName;
    this.currentInputListItem.mRID = selectedComponent.mRID;
    this._enableOrDisableAddInputItemButton();
  }

  private _normalizePhases(phases: string) {
    // If phases is a string containing either A or B or C,
    // then return it as is
    return /^[abc]+$/i.test(phases) ? phases : [phases];
  }

  onInputPhasesChanged(selectedPhases: Array<{ phaseLabel: string; phaseIndex: number }>) {
    this.currentInputListItem.phases = selectedPhases.sort((a, b) => a.phaseLabel.localeCompare(b.phaseLabel));
    this._enableOrDisableAddInputItemButton();
  }

  onInputAttributeChanged(selectedValue: string) {
    this.currentInputListItem.attribute = selectedValue;
    this._enableOrDisableAddInputItemButton();
  }

  addNewInputItem() {
    this.setState({
      inputList: [...this.state.inputList, this.currentInputListItem],
      inputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      inputAttributeBuilder: SelectionOptionBuilder.defaultBuilder(),
      addInputItemButtonDisabled: true
    });
    const type = this.currentInputListItem.type;
    this.currentInputListItem = this._newInputListItem();
    this.currentInputListItem.type = type;
    this.inputComponentTypeSelect.reset();
  }

  onAllOutputOutageCheckBoxToggled(state: boolean) {
    this.formValue.allOutputOutage = state;
    if (state) {
      this.setState({
        outputEquipmentTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
        outputList: [],
        allOutputOutageChecked: true
      });
    }
    else
      this.setState({
        outputEquipmentTypeOptionBuilder: outputEquipmentTypeOptionBuilder,
        allOutputOutageChecked: false
      });
  }

  onOuputEquipmentTypeChanged(selectedType: string) {
    this.currentOutputListItem = this._newOutputListItem();
    this.currentOutputListItem.type = selectedType;
    this.setState({
      outputComponentOptionBuilder: new SelectionOptionBuilder(
        this.props.modelDictionary.measurements.filter(
          e => e.ConductingEquipment_type === selectedType
        ),
        measurement => `${measurement.ConductingEquipment_name} (${measurement.phases})`
      ),
      outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputComponentChanged(selectedValue: ModelDictionaryMeasurement) {
    this.currentOutputListItem.name = selectedValue.ConductingEquipment_name;
    this.setState({
      outputPhaseOptionBuilder: new SelectionOptionBuilder(
        unique(this._normalizePhases(selectedValue.phases)).sort((a, b) => a.localeCompare(b)),
      ),
      outputMeasurementTypeOptionBuilder: new SelectionOptionBuilder(
        [selectedValue.measurementType]
      )
    });
    this.currentOutputListItem.mRID = selectedValue.ConductingEquipment_mRID;
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputPhasesChanged(selectedPhases: string[]) {
    this.currentOutputListItem.phases = selectedPhases;
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputMeasurementTypesChanged(selectedTypes: string[]) {
    this.currentOutputListItem.measurementTypes = selectedTypes;
    this._enableOrDisableAddOutputItemButton();
  }

  addNewOutputItem() {
    this.setState({
      outputList: [...this.state.outputList, this.currentOutputListItem],
      outputComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputPhaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      outputMeasurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      addOutputItemButtonDisabled: true
    });
    const type = this.currentOutputListItem.type;
    this.currentOutputListItem = this._newOutputListItem();
    this.currentOutputListItem.type = type;
    this.outputComponentTypeSelect.reset();
  }

  private _enableOrDisableAddOutputItemButton() {
    if (
      this.currentOutputListItem.name !== '' &&
      this.currentOutputListItem.type !== '' &&
      this.currentOutputListItem.phases.length > 0 &&
      this.currentOutputListItem.measurementTypes.length > 0
    )
      this.setState({
        addOutputItemButtonDisabled: false
      });
    else
      this.setState({
        addOutputItemButtonDisabled: true
      });
  }

  onStartDateTimeChanged(value: string) {
    this.formValue.startDateTime = this.dateTimeService.parse(value);
  }

  onStopDateTimeChanged(value: string) {
    this.formValue.stopDateTime = this.dateTimeService.parse(value);
  }

  disableAddEventButton(): boolean {
    if (!this.state.allInputOutageChecked && this.state.inputList.length === 0)
      return true;
    if (!this.state.allOutputOutageChecked && this.state.outputList.length === 0)
      return true;

    return false;
  }

  createNewEvent() {
    this.formValue.inputList = this.state.inputList;
    this.formValue.outputList = this.state.outputList;
    this.props.onEventAdded(this.formValue);
    this.setState({
      inputList: [],
      outputList: [],
      inputEquipmentTypeOptionBuilder: inputEquipmentTypeOptionBuilder,
      outputEquipmentTypeOptionBuilder: outputEquipmentTypeOptionBuilder,
      addInputItemButtonDisabled: true,
      addOutputItemButtonDisabled: true,
      allInputOutageChecked: false,
      allOutputOutageChecked: false
    });
    this.currentInputListItem = this._newInputListItem();
    this.currentOutputListItem = this._newOutputListItem();
  }

}
