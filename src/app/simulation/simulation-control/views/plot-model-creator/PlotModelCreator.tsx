import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { BasicButton } from '@shared/buttons';
import { Input, Option, Select, CheckBox } from '@shared/form';
import { ModelDictionaryComponentType, ModelDictionaryComponent } from '@shared/topology';
import { PlotModelSummary } from './PlotModelSummary';
import { toOptions } from '@shared/form/select/utils';
import { PlotModel, PlotModelComponent } from '@shared/plot-model';
import { Validators } from '@shared/form/validation';

import './PlotModelCreator.scss';

interface Props {
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
  existingPlotModels: PlotModel[];
  onClose: () => void;
  onSubmit: (plotModels: PlotModel[]) => void;
}

interface State {
  componentOptions: Option<ModelDictionaryComponent>[];
  allPlotModelOptions: Option<PlotModel>[];
  componentTypeOptions: Option<ModelDictionaryComponentType>[];
  createdPlotModels: PlotModel[];
  currentPlotModel: PlotModel;
  selectedComponent: ModelDictionaryComponent;
  disableAddComponentButton: boolean;
  // When the users select a component from the "Component" drop down,
  // they can then select the desired phases(A, B, C) for this component,
  // this list keeps track of the selected component at those phases
  createdPlotModelComponentsWithPhase: PlotModelComponent[];
  phaseOptions: Option<string>[];
}

export class PlotModelCreator extends React.Component<Props, State> {

  allPlotSelect: Select<any, boolean>;
  componentSelect: Select<any, boolean>;

  constructor(props: Props) {
    super(props);
    this.state = {
      componentOptions: [],
      allPlotModelOptions: toOptions(props.existingPlotModels, plotModel => plotModel.name),
      componentTypeOptions: [
        new Option('Power', ModelDictionaryComponentType.POWER),
        new Option('Tap', ModelDictionaryComponentType.TAP),
        new Option('Voltage', ModelDictionaryComponentType.VOLTAGE)
      ],
      createdPlotModels: props.existingPlotModels,
      currentPlotModel: this._createDefaultPlotModel(),
      selectedComponent: null,
      disableAddComponentButton: true,
      createdPlotModelComponentsWithPhase: [],
      phaseOptions: []
    };

    this.onPlotNameFormControlValidated = this.onPlotNameFormControlValidated.bind(this);
    this.onPlotNameChanged = this.onPlotNameChanged.bind(this);
    this.onComponentTypeSelectionCleared = this.onComponentTypeSelectionCleared.bind(this);
    this.onComponentTypeChanged = this.onComponentTypeChanged.bind(this);
    this.toggleUseMagnitude = this.toggleUseMagnitude.bind(this);
    this.toggleUseAngle = this.toggleUseAngle.bind(this);
    this.onComponentSelectionCleared = this.onComponentSelectionCleared.bind(this);
    this.onComponentChanged = this.onComponentChanged.bind(this);
    this.onComponentPhasesSelectionCleared = this.onComponentPhasesSelectionCleared.bind(this);
    this.onComponentPhasesSelected = this.onComponentPhasesSelected.bind(this);
    this.onRemovePlotModel = this.onRemovePlotModel.bind(this);
    this.onPlotModelUpdated = this.onPlotModelUpdated.bind(this);
    this.addPlotModelComponent = this.addPlotModelComponent.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  private _createDefaultPlotModel(plotName = ''): PlotModel {
    return {
      name: plotName,
      components: [],
      componentType: ModelDictionaryComponentType.NONE,
      useMagnitude: false,
      useAngle: false
    };
  }

  render() {
    return (
      <Dialog
        show={true}
        className='plot-model-creator'>
        <DialogContent>
          <div className='plot-model-creator__body'>
            <form className='plot-model-creator__body__form'>
              <Select
                ref={ref => this.allPlotSelect = ref}
                multiple={false}
                label='Created plots'
                optional={true}
                options={this.state.allPlotModelOptions}
                isOptionSelected={
                  option => option.value === this.state.currentPlotModel
                }
                onChange={this.onPlotNameChanged} />
              <Input
                label='Plot name'
                value={this.state.currentPlotModel.name}
                name='newPlotName'
                validators={[
                  Validators.checkNotEmpty('Plot name is required')
                ]}
                onValidate={this.onPlotNameFormControlValidated}
                onChange={this.onPlotNameChanged} />
              <Select
                multiple={false}
                optional={false}
                label='Component type'
                disabled={this.state.currentPlotModel.components.length > 0 || this.state.currentPlotModel.name === ''}
                isOptionSelected={option => option.value === this.state.currentPlotModel.componentType}
                options={this.state.componentTypeOptions}
                onClear={this.onComponentTypeSelectionCleared}
                onChange={this.onComponentTypeChanged} />
              <CheckBox
                label='Magnitude'
                name='useMagnitude'
                labelPosition='right'
                checked={this.state.currentPlotModel.useMagnitude}
                disabled={this.disableMagnitudeAndAngleCheckboxes()}
                onChange={this.toggleUseMagnitude} />
              <CheckBox
                label='Angle'
                name='useAngle'
                labelPosition='right'
                checked={this.state.currentPlotModel.useAngle}
                disabled={this.disableMagnitudeAndAngleCheckboxes()}
                onChange={this.toggleUseAngle} />
              <Select
                ref={ref => this.componentSelect = ref}
                multiple={false}
                optional={false}
                label='Component'
                options={this.state.componentOptions}
                onClear={this.onComponentSelectionCleared}
                onChange={this.onComponentChanged} />
              <Select
                multiple={true}
                label='Phases'
                optional={false}
                disabled={!this.state.selectedComponent}
                options={this.state.phaseOptions}
                onClear={this.onComponentPhasesSelectionCleared}
                onChange={this.onComponentPhasesSelected} />
              <BasicButton
                type='positive'
                label='Add component'
                disabled={this.state.disableAddComponentButton}
                onClick={this.addPlotModelComponent} />
            </form>
            <div className='plot-model-creator__body__created-plot-models'>
              {this.state.createdPlotModels.map(plotModel => (
                <PlotModelSummary
                  key={plotModel.name + plotModel.components.length}
                  plotModel={plotModel}
                  onRemove={this.onRemovePlotModel}
                  onUpdate={this.onPlotModelUpdated} />
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Close'
            onClick={this.props.onClose} />
          <BasicButton
            type='positive'
            label='Done'
            onClick={this.onSubmit} />
        </DialogActions>
      </Dialog>
    );
  }

  onPlotNameFormControlValidated(isValid: boolean, _: string, currentValue: string) {
    if (!isValid) {
      this.state.currentPlotModel.name = currentValue;
      this.setState({
        disableAddComponentButton: true
      });
    }
  }

  onPlotNameChanged(item: string | Option<PlotModel>) {
    // When the "Add component" is clicked to add a new plot model component,
    // the "Created plots" dropdown's option list is refreshed, so the function
    // passed to "Created plots" select's isOptionSelected prop is called, and this.allPlotSelect
    // will be null for some reason, so check that it is not null first
    if (this.allPlotSelect) {
      const newPlotModel = typeof item === 'string'
        ? this.state.createdPlotModels.find(e => e.name === item) || this._createDefaultPlotModel(item)
        : item.value;

      this.setState({
        currentPlotModel: newPlotModel,
        selectedComponent: null,
        componentOptions: newPlotModel.componentType === ModelDictionaryComponentType.NONE
          ? []
          : toOptions(
            this.props.modelDictionaryComponentsWithConsolidatedPhases.filter(e => e.type === newPlotModel.componentType),
            e => e.displayName
          ),
        phaseOptions: [],
        componentTypeOptions: [...this.state.componentTypeOptions]
      });
      // When "Plot name" text input changes, we want to reset the "Created plots" drop down
      // so that if it has a selected value, it needs to show the default text
      if (typeof item === 'string')
        this.allPlotSelect.reset();
    }
  }

  onComponentTypeSelectionCleared() {
    this.setState({
      disableAddComponentButton: true,
      componentOptions: [],
      selectedComponent: null,
      phaseOptions: []
    });
  }

  onComponentTypeChanged(option: Option<ModelDictionaryComponentType>) {
    this.setState({
      componentOptions: toOptions(
        this.props.modelDictionaryComponentsWithConsolidatedPhases.filter(e => e.type === option.value),
        e => e.displayName
      ),
      selectedComponent: null,
      phaseOptions: []
    });
    this.state.currentPlotModel.componentType = option.value;
  }

  disableMagnitudeAndAngleCheckboxes() {
    return (this.state.currentPlotModel.componentType !== ModelDictionaryComponentType.POWER
      && this.state.currentPlotModel.componentType !== ModelDictionaryComponentType.VOLTAGE)
      || this.state.currentPlotModel.components.length > 0;

  }

  toggleUseMagnitude(state: boolean) {
    this.state.currentPlotModel.useMagnitude = state;
  }

  toggleUseAngle(state: boolean) {
    this.state.currentPlotModel.useAngle = state;
  }

  onComponentSelectionCleared() {
    this.setState({
      disableAddComponentButton: true,
      selectedComponent: null,
      createdPlotModelComponentsWithPhase: [],
      phaseOptions: []
    });
  }

  onComponentChanged(option: Option<ModelDictionaryComponent>) {
    this.setState({
      selectedComponent: option.value,
      phaseOptions: toOptions(option.value.phases.split(''), e => e)
    });
  }

  onComponentPhasesSelectionCleared() {
    this.setState({
      disableAddComponentButton: true,
      createdPlotModelComponentsWithPhase: []
    });
  }

  onComponentPhasesSelected(options: Option<string>[]) {
    const currentPlotModel = this.state.currentPlotModel;
    const selectedComponent = this.state.selectedComponent;
    const createdPlotModelComponentsWithPhase = [];
    for (const option of options) {
      const selectedPhase = option.value;
      const plotModelComponentDisplayName = `${selectedComponent.id} (${selectedPhase})`;
      if (currentPlotModel.components.find(e => e.displayName === plotModelComponentDisplayName) === undefined) {
        const plotModelComponentAtSelectedPhase: PlotModelComponent = {
          id: selectedComponent.id,
          displayName: plotModelComponentDisplayName,
          phase: selectedPhase
        };
        createdPlotModelComponentsWithPhase.push(plotModelComponentAtSelectedPhase);
      }
    }
    this.setState({
      disableAddComponentButton: false,
      createdPlotModelComponentsWithPhase
    });
  }

  onRemovePlotModel(plotModel: PlotModel) {
    this.setState(state => ({
      createdPlotModels: state.createdPlotModels.filter(existing => existing !== plotModel),
      allPlotModelOptions: state.allPlotModelOptions.filter(existing => existing.value !== plotModel)
    }));
    if (this.state.currentPlotModel === plotModel) {
      this.setState({
        currentPlotModel: this._createDefaultPlotModel(),
        componentOptions: [],
        selectedComponent: null,
        phaseOptions: []
      });
    }
  }

  onPlotModelUpdated(updatedPlotModel: PlotModel) {
    const newPlotModel = { ...updatedPlotModel } as PlotModel;
    const updatedPlotModels = this.state.createdPlotModels.map(model => {
      return model !== updatedPlotModel ? model : newPlotModel;
    });
    this.setState({
      allPlotModelOptions: toOptions(updatedPlotModels, model => model.name),
      createdPlotModels: updatedPlotModels
    });
    if (updatedPlotModel === this.state.currentPlotModel)
      this.setState({
        currentPlotModel: newPlotModel,
        selectedComponent: null,
        phaseOptions: [],
        disableAddComponentButton: true
      });
  }

  addPlotModelComponent() {
    this.state.currentPlotModel.components = [
      ...this.state.currentPlotModel.components,
      ...this.state.createdPlotModelComponentsWithPhase
    ];
    const updatedPlotModels = this.state.createdPlotModels.includes(this.state.currentPlotModel)
      ? [...this.state.createdPlotModels]
      : [...this.state.createdPlotModels, this.state.currentPlotModel];
    this.setState({
      createdPlotModels: updatedPlotModels,
      allPlotModelOptions: toOptions(updatedPlotModels, plotModel => plotModel.name),
      selectedComponent: null,
      disableAddComponentButton: true,
      createdPlotModelComponentsWithPhase: [],
      phaseOptions: []
    });
    this.componentSelect.reset();
  }

  onSubmit() {
    // For plot model that has useMagnitude and useAngle both
    // set to true, we need to duplicate it and set either useMagnitude
    // or useAngle to true and leave the other flag false, and update the name accordingly
    const resultingPlotModels = [];
    for (const createdPlotModel of this.state.createdPlotModels) {
      if (createdPlotModel.useAngle && createdPlotModel.useMagnitude) {
        const plotModelUsingMagnitude = this._createDefaultPlotModel(createdPlotModel.name + ' (1)');
        const plotModelUsingAngle = this._createDefaultPlotModel(createdPlotModel.name + ' (2)');
        plotModelUsingMagnitude.componentType = createdPlotModel.componentType;
        plotModelUsingMagnitude.useMagnitude = true;
        plotModelUsingMagnitude.components = createdPlotModel.components;
        plotModelUsingAngle.componentType = createdPlotModel.componentType;
        plotModelUsingAngle.useAngle = true;
        plotModelUsingAngle.components = createdPlotModel.components;
        resultingPlotModels.push(plotModelUsingMagnitude, plotModelUsingAngle);
      }
      else
        resultingPlotModels.push(createdPlotModel);
    }
    this.props.onSubmit(resultingPlotModels);
  }

}
