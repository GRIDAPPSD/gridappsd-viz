import * as React from 'react';

import { BasicButton, IconButton } from '@shared/buttons';
import { ModelDictionary, ModelDictionaryMeasurement } from '@shared/topology/model-dictionary';
import { FormGroup, CheckBox, Select, Option, Input } from '@shared/form';
import { COMPONENT_ATTRIBUTES } from '../../models/component-attributes';
import { OutageEvent, OutageEventInputListItem, OutageEventOutputListItem } from '../../models/OutageEvent';
import { Tooltip } from '@shared/tooltip';

import './OutageEventForm.scss';

let outputEquipmentTypeOptions: Option<string>[];

interface Props {
  onEventAdded: (event: OutageEvent) => void;
  initialFormValue: OutageEvent;
  modelDictionary: ModelDictionary;
}

interface State {
  inputEquipmentTypeOptions: Option<string>[];
  inputComponentOptions: Option<any>[];
  inputPhaseOptions: Option<string>[];
  inputAttributeOptions: Option<string>[];
  outputEquipmentTypeOptions: Option<string>[];
  outputComponentOptions: Option<ModelDictionaryMeasurement>[];
  outputPhaseOptions: Option<string>[];
  outputMeasurementTypeOptions: Option<any>[];
  inputList: OutageEventInputListItem[];
  outputList: OutageEventOutputListItem[];
  addInputItemButtonDisabled: boolean;
  addOutputItemButtonDisabled: boolean;
}

export class OutageEventForm extends React.Component<Props, State> {
  formValue: OutageEvent;
  currentInputListItem: OutageEventInputListItem;
  currentOutputListItem: OutageEventOutputListItem;
  inputComponentTypeSelect: Select<string>;
  outputComponentTypeSelect: Select<string>;

  constructor(props: Props) {
    super(props);

    if (!outputEquipmentTypeOptions)
      outputEquipmentTypeOptions = this._generateUniqueOptions(
        props.modelDictionary.measurements.map(e => e.ConductingEquipment_type)
      );

    this.state = {
      inputEquipmentTypeOptions: [
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
      inputComponentOptions: [],
      inputPhaseOptions: [],
      inputAttributeOptions: [],
      outputEquipmentTypeOptions,
      outputComponentOptions: [],
      outputPhaseOptions: [],
      outputMeasurementTypeOptions: [],
      inputList: [],
      outputList: [],
      addInputItemButtonDisabled: true,
      addOutputItemButtonDisabled: true
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

  private _generateUniqueOptions(iterable: string[] | string): Option[] {
    const result = [];
    for (const element of iterable)
      if (!result.includes(element))
        result.push(element);
    return result.map(e => new Option(e));
  }

  private _newInputListItem(): OutageEventInputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      attribute: ''
    };
  }

  private _newOutputListItem(): OutageEventOutputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      measurementTypes: []
    };
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.initialFormValue !== this.props.initialFormValue)
      this.formValue = { ...this.props.initialFormValue };
  }

  render() {
    return (
      <div className='outage-event'>
        <FormGroup label='Input Outage List'>
          <CheckBox
            label='All Input Outage'
            name='allInputOutage'
            checked={this.formValue.allInputOutage}
            onChange={this.onAllInputOutageCheckboxToggled} />
          <Select
            ref={comp => this.inputComponentTypeSelect = comp}
            label='Equipment Type'
            options={this.state.inputEquipmentTypeOptions}
            onChange={this.onInputEquipmentTypeChanged} />
          <Select
            label='Name'
            options={this.state.inputComponentOptions}
            onChange={this.onInputComponentChanged} />
          <Select
            label='Phase'
            multiple
            options={this.state.inputPhaseOptions}
            onChange={this.onInputPhasesChanged} />
          <Select
            label='Attribute'
            options={this.state.inputAttributeOptions}
            onChange={this.onInputAttributeChanged} />
          <Tooltip
            content='Add input item'
            position='right'>
            <IconButton
              disabled={this.state.addInputItemButtonDisabled}
              className='outage-event-form__add-input'
              icon='add'
              onClick={this.addNewInputItem} />
          </Tooltip>
          {
            this.state.inputList.length > 0 &&
            <table className='outage-event-form__input-output-list'>
              <thead>
                <tr>
                  <th></th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Phases</th>
                  <th>Attributes</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.inputList.map((e, i) => (
                    <tr key={i}>
                      <td>
                        <Tooltip content='Delete'>
                          <IconButton
                            style='accent'
                            size='small'
                            icon='delete'
                            onClick={() => this.setState({ inputList: this.state.inputList.filter(item => item !== e) })} />
                        </Tooltip>
                      </td>
                      <td>{e.type}</td>
                      <td>{e.name}</td>
                      <td>{e.phases.map((e, i) => <div key={i}>{e}</div>)}</td>
                      <td>
                        <div>{e.attribute}</div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          }
        </FormGroup>
        <FormGroup label='Output Outage List'>
          <CheckBox
            label='All Ouput Outage'
            name='allOutputOutage'
            checked={this.formValue.allOutputOutage}
            onChange={this.onAllOutputOutageCheckBoxToggled} />
          <Select
            ref={comp => this.outputComponentTypeSelect = comp}
            label='Equipment Type'
            options={this.state.outputEquipmentTypeOptions}
            onChange={this.onOuputEquipmentTypeChanged} />
          <Select
            label='Equipment Name'
            options={this.state.outputComponentOptions}
            onChange={this.onOutputComponentChanged} />
          <Select
            label='Phase'
            multiple
            options={this.state.outputPhaseOptions}
            onChange={this.onOutputPhasesChanged} />
          <Select
            label='Measurement Type'
            options={this.state.outputMeasurementTypeOptions}
            onChange={this.onOutputMeasurementTypesChanged} />
          <Input
            label='Start Date Time'
            name='startDateTime'
            value={this.formValue.startDateTime}
            onChange={this.onStartDateTimeChanged} />
          <Input
            label='Stop Date Time'
            name='stopDateTime'
            value={this.formValue.stopDateTime}
            onChange={this.onStopDateTimeChanged} />
          <Tooltip
            content='Add output item'
            position='right'>
            <IconButton
              disabled={this.state.addOutputItemButtonDisabled}
              className='outage-event-form__add-output'
              icon='add'
              onClick={this.addNewOutputItem} />
          </Tooltip>
          {
            this.state.outputList.length > 0 &&
            <table className='outage-event-form__input-output-list'>
              <thead>
                <tr>
                  <th></th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Phases</th>
                  <th>Measurement types</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.state.outputList.map((e, i) => (
                    <tr key={i}>
                      <td>
                        <Tooltip content='Delete'>
                          <IconButton
                            style='accent'
                            size='small'
                            icon='delete'
                            onClick={() => this.setState({ outputList: this.state.outputList.filter(item => item !== e) })} />
                        </Tooltip>
                      </td>
                      <td>{e.type}</td>
                      <td>{e.name}</td>
                      <td>{e.phases.map((e, i) => <div key={i}>{e}</div>)}</td>
                      <td>{e.measurementTypes.map((e, i) => <div key={i}>{e}</div>)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          }
        </FormGroup>
        <BasicButton
          disabled={this.state.inputList.length === 0 || this.state.outputList.length === 0}
          className='outage-event-form__add-event'
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  onAllInputOutageCheckboxToggled(state: boolean) {
    this.formValue.allInputOutage = state;
  }

  onInputEquipmentTypeChanged(selectedOptions: Option<string>[]) {
    const selectedType = selectedOptions[0].value;
    this.setState({
      inputComponentOptions: (this.props.modelDictionary[selectedType] || []).map(e => new Option(e.name || e.bankName, e)),
      inputAttributeOptions: (COMPONENT_ATTRIBUTES[selectedType] || []).map(e => new Option(e)),
      inputPhaseOptions: []
    });
    this.currentInputListItem = this._newInputListItem();
    this.currentInputListItem.type = selectedOptions[0].label;
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

  onInputComponentChanged(selectedOptions: Option<any>[]) {
    const selectedOption = selectedOptions[0];
    this.setState({
      inputPhaseOptions: this._generateUniqueOptions(
        this._normalizePhases(selectedOption.value.phases || selectedOption.value.bankPhases)
      )
        .sort((a, b) => a.label.localeCompare(b.label))
    });
    this.currentInputListItem.name = selectedOption.label;
    this.currentInputListItem.mRID = selectedOption.value.mRID;
    this._enableOrDisableAddInputItemButton();
  }

  private _normalizePhases(phases: string) {
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? phases : [phases];
  }

  onInputPhasesChanged(selectedOptions: Option<string>[]) {
    this.currentInputListItem.phases = selectedOptions.map(option => option.value).sort();
    this._enableOrDisableAddInputItemButton();
  }

  onInputAttributeChanged(selectedOptions: Option<string>[]) {
    this.currentInputListItem.attribute = selectedOptions[0].value;
    this._enableOrDisableAddInputItemButton();
  }

  addNewInputItem() {
    this.setState({
      inputList: [...this.state.inputList, this.currentInputListItem],
      inputComponentOptions: [],
      inputPhaseOptions: [],
      inputAttributeOptions: [],
      addInputItemButtonDisabled: true
    });
    const type = this.currentInputListItem.type;
    this.currentInputListItem = this._newInputListItem();
    this.currentInputListItem.type = type;
    this.inputComponentTypeSelect.reset();
  }

  onAllOutputOutageCheckBoxToggled(state: boolean) {
    this.formValue.allOutputOutage = state;
  }

  onOuputEquipmentTypeChanged(selectedOptions: Option<string>[]) {
    const selectedType = selectedOptions[0].value;
    this.currentOutputListItem = this._newOutputListItem();
    this.currentOutputListItem.type = selectedType;
    this.setState({
      outputComponentOptions: this.props.modelDictionary.measurements.filter(
        e => e.ConductingEquipment_type === selectedType
      )
        .map(e => new Option(e.ConductingEquipment_name, e)),
      outputPhaseOptions: [],
      outputMeasurementTypeOptions: []
    });
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputComponentChanged(selectedOptions: Option<ModelDictionaryMeasurement>[]) {
    const selectedOption = selectedOptions[0];
    this.currentOutputListItem.name = selectedOption.label;
    this.setState({
      outputPhaseOptions: this._generateUniqueOptions(this._normalizePhases(selectedOption.value.phases))
        .sort((a, b) => a.label.localeCompare(b.label)),
      outputMeasurementTypeOptions: [new Option(selectedOption.value.measurementType)]
    });
    this.currentOutputListItem.mRID = selectedOption.value.ConductingEquipment_mRID;
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputPhasesChanged(selectedOptions: Option<string>[]) {
    this.currentOutputListItem.phases = selectedOptions.map(option => option.value);
    this._enableOrDisableAddOutputItemButton();
  }

  onOutputMeasurementTypesChanged(selectedOptions: Option<string>[]) {
    this.currentOutputListItem.measurementTypes = selectedOptions.map(option => option.value);
    this._enableOrDisableAddOutputItemButton();
  }

  addNewOutputItem() {
    this.setState({
      outputList: [...this.state.outputList, this.currentOutputListItem],
      outputComponentOptions: [],
      outputPhaseOptions: [],
      outputMeasurementTypeOptions: [],
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
    this.formValue.startDateTime = value;
  }

  onStopDateTimeChanged(value: string) {
    this.formValue.stopDateTime = value;
  }

  createNewEvent() {
    this.formValue.inputList = this.state.inputList;
    this.formValue.outputList = this.state.outputList;
    this.props.onEventAdded(this.formValue);
    this.setState({
      inputList: [],
      outputList: [],
      addInputItemButtonDisabled: true,
      addOutputItemButtonDisabled: true
    });
  }

}
