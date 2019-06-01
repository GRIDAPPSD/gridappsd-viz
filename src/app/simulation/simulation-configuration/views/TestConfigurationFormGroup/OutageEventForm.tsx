import * as React from 'react';

import { BasicButton, IconButton } from '@shared/buttons';
import { ModelDictionary, ModelDictionaryMeasurement } from '@shared/topology/model-dictionary';
import { FormGroup, CheckBox, Select, Option, Input } from '@shared/form';
import { COMPONENT_ATTRIBUTES } from '../../models/component-attributes';
import { OutageEvent, OutageEventInputListItem, OutageEventOutputListItem } from '../../models/OutageEvent';
import { Tooltip } from '@shared/tooltip';

import './OutageEventForm.scss';

let outputEquipmentTypeOptions: Option<string>[];
let outputMeasurementTypeOptions: Option<any>[];

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

    if (!outputEquipmentTypeOptions && !outputMeasurementTypeOptions) {
      outputEquipmentTypeOptions = this.generateUniqueOptions(
        props.modelDictionary.measurements.map(e => e.ConductingEquipment_type)
      );
      outputMeasurementTypeOptions = this.generateUniqueOptions(
        props.modelDictionary.measurements.map(e => e.measurementType)
      );
    }
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
      outputMeasurementTypeOptions,
      inputList: [],
      outputList: [],
      addInputItemButtonDisabled: true,
      addOutputItemButtonDisabled: true
    };

    this.formValue = { ...props.initialFormValue };
    this.currentInputListItem = this.newInputListItem();
    this.currentOutputListItem = this.newOutputListItem();
  }

  newInputListItem(): OutageEventInputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      attribute: ''
    };
  }

  newOutputListItem(): OutageEventOutputListItem {
    return {
      name: '',
      type: '',
      mRID: '',
      phases: [],
      measurementTypes: []
    };
  }

  generateUniqueOptions(iterable: string[] | string): Option[] {
    const result = [];
    for (const element of iterable)
      if (!result.includes(element))
        result.push(element);
    return result.map(e => new Option(e));
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
            onChange={state => this.formValue.allInputOutage = state} />
          <Select
            ref={comp => this.inputComponentTypeSelect = comp}
            label='Equipment Type'
            options={this.state.inputEquipmentTypeOptions}
            onChange={options => {
              const type = options[0].value;
              this.setState({
                inputComponentOptions: (this.props.modelDictionary[type] || []).map(e => new Option(e.name || e.bankName, e)),
                inputAttributeOptions: (COMPONENT_ATTRIBUTES[type] || []).map(e => new Option(e)),
                inputPhaseOptions: []
              });
              this.currentInputListItem = this.newInputListItem();
              this.currentInputListItem.type = options[0].label;
              this.enableOrDisableAddInputItemButton();
            }} />
          <Select
            label='Name'
            options={this.state.inputComponentOptions}
            onChange={options => {
              const selectedOption = options[0];
              this.setState({
                inputPhaseOptions: this.generateUniqueOptions(
                  this.normalizePhases(selectedOption.value.phases || selectedOption.value.bankPhases)
                )
                  .sort((a, b) => a.label.localeCompare(b.label))
              });
              this.currentInputListItem.name = selectedOption.label;
              this.currentInputListItem.mRID = selectedOption.value.mRID;
              this.enableOrDisableAddInputItemButton();
            }} />
          <Select
            label='Phase'
            multiple
            options={this.state.inputPhaseOptions}
            onChange={options => {
              this.currentInputListItem.phases = options.map(option => option.value).sort();
              this.enableOrDisableAddInputItemButton();
            }} />
          <Select
            label='Attribute'
            options={this.state.inputAttributeOptions}
            onChange={options => {
              this.currentInputListItem.attribute = options[0].value;
              this.enableOrDisableAddInputItemButton();
            }} />
          <Tooltip
            content='Add input item'
            position='right'>
            <IconButton
              disabled={this.state.addInputItemButtonDisabled}
              className='outage-event-form__add-input'
              rounded
              icon='add'
              onClick={() => {
                this.setState({
                  inputList: [...this.state.inputList, this.currentInputListItem],
                  inputComponentOptions: [],
                  inputPhaseOptions: [],
                  inputAttributeOptions: [],
                  addInputItemButtonDisabled: true
                });
                const type = this.currentInputListItem.type;
                this.currentInputListItem = this.newInputListItem();
                this.currentInputListItem.type = type;
                this.inputComponentTypeSelect.reset();
              }} />
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
                            rounded
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
            onChange={state => this.formValue.allOutputOutage = state} />
          <Select
            ref={comp => this.outputComponentTypeSelect = comp}
            label='Equipment Type'
            options={this.state.outputEquipmentTypeOptions}
            onChange={options => {
              const selectedType = options[0].value;
              this.currentOutputListItem = this.newOutputListItem();
              this.currentOutputListItem.type = selectedType;
              this.setState({
                outputComponentOptions: this.props.modelDictionary.measurements.filter(
                  e => e.ConductingEquipment_type === selectedType
                )
                  .map(e => new Option(e.ConductingEquipment_name, e)),
                outputPhaseOptions: [],
                outputMeasurementTypeOptions: []
              });
              this.enableOrDisableAddOutputItemButton();
            }} />
          <Select
            label='Equipment Name'
            options={this.state.outputComponentOptions}
            onChange={options => {
              const selectedOption = options[0];
              this.currentOutputListItem.name = selectedOption.label;
              this.setState({
                outputPhaseOptions: this.generateUniqueOptions(this.normalizePhases(selectedOption.value.phases))
                  .sort((a, b) => a.label.localeCompare(b.label)),
                outputMeasurementTypeOptions: this.generateUniqueOptions(selectedOption.value.measurementType.split(''))
              });
              this.currentOutputListItem.mRID = selectedOption.value.ConductingEquipment_mRID;
              this.enableOrDisableAddOutputItemButton();
            }} />
          <Select
            label='Phase'
            multiple
            options={this.state.outputPhaseOptions}
            onChange={options => {
              this.currentOutputListItem.phases = options.map(option => option.value);
              this.enableOrDisableAddOutputItemButton();
            }} />
          <Select
            label='Measurement Type'
            multiple
            options={this.state.outputMeasurementTypeOptions}
            onChange={options => {
              this.currentOutputListItem.measurementTypes = options.map(option => option.value);
              this.enableOrDisableAddOutputItemButton();
            }} />
          <Input
            label='Start Date Time'
            name='startDateTime'
            value={this.formValue.startDateTime}
            onChange={value => this.formValue.startDateTime = value} />
          <Input
            label='Stop Date Time'
            name='stopDateTime'
            value={this.formValue.stopDateTime}
            onChange={value => this.formValue.stopDateTime = value} />
          <Tooltip
            content='Add output item'
            position='right'>
            <IconButton
              disabled={this.state.addOutputItemButtonDisabled}
              rounded
              className='outage-event-form__add-output'
              icon='add'
              onClick={() => {
                this.setState({
                  outputList: [...this.state.outputList, this.currentOutputListItem],
                  outputComponentOptions: [],
                  outputPhaseOptions: [],
                  outputMeasurementTypeOptions: [],
                  addOutputItemButtonDisabled: true
                });
                const type = this.currentOutputListItem.type;
                this.currentOutputListItem = this.newOutputListItem();
                this.currentOutputListItem.type = type;
                this.outputComponentTypeSelect.reset();
              }} />
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
                            rounded
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
          onClick={() => {
            this.formValue.inputList = this.state.inputList;
            this.formValue.outputList = this.state.outputList;
            this.props.onEventAdded(this.formValue);
            this.setState({
              inputList: [],
              outputList: [],
              addInputItemButtonDisabled: true,
              addOutputItemButtonDisabled: true
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
      result.push(...subArray);
    return result;
  }

  enableOrDisableAddInputItemButton() {
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

  enableOrDisableAddOutputItemButton() {
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

}
