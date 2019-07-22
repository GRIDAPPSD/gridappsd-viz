import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { BasicButton } from '@shared/buttons';
import { Input, Option, Select } from '@shared/form';
import { PlotModel, PlotModelComponentType, PlotModelComponent } from '@shared/plot-model';
import { ModelDictionary } from '@shared/topology';
import { PlotModelSummary } from './PlotModelSummary';
import { removeOptionsWithIdenticalLabel, toOptions } from '@shared/form/select/utils';

import './PlotModelCreator.scss';

interface Props {
  onClose: () => void;
  onSubmit: (plotModels: PlotModel[]) => void;
  modelDictionary: ModelDictionary;
  existingPlotModels: PlotModel[];
}

interface State {
  componentOptions: Option<PlotModelComponent>[];
  allPlotModelOptions: Option<PlotModel>[];
  componentTypeOptions: Option<PlotModelComponentType>[];
  createdPlotModels: PlotModel[];
  currentPlotModel: PlotModel;
}

export class PlotModelCreator extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      componentOptions: [],
      allPlotModelOptions: toOptions(props.existingPlotModels, plotModel => plotModel.name),
      componentTypeOptions: [
        new Option('Power', PlotModelComponentType.POWER),
        new Option('Tap', PlotModelComponentType.TAP),
        new Option('Voltage', PlotModelComponentType.VOLTAGE)
      ],
      createdPlotModels: props.existingPlotModels,
      currentPlotModel: this._createDefaultPlotModel()
    };

    this.onPlotNameChanged = this.onPlotNameChanged.bind(this);
    this.onComponentTypeChanged = this.onComponentTypeChanged.bind(this);
    this.onComponentsSelected = this.onComponentsSelected.bind(this);
    this.onRemovePlotModel = this.onRemovePlotModel.bind(this);
    this.onPlotModelUpdated = this.onPlotModelUpdated.bind(this);
  }

  private _createDefaultPlotModel(plotName = ''): PlotModel {
    return {
      name: plotName,
      components: [],
      componentType: PlotModelComponentType.NONE
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
                multiple={false}
                label='Created plots'
                options={this.state.allPlotModelOptions}
                onChange={this.onPlotNameChanged} />
              <Input
                label='Plot name'
                value={this.state.currentPlotModel.name}
                name='newPlotName'
                onChange={this.onPlotNameChanged} />
              <Select
                multiple={false}
                label='Component type'
                disabled={this.state.currentPlotModel.name === ''}
                isOptionSelected={option => this.state.currentPlotModel.componentType === option.value}
                options={this.state.componentTypeOptions}
                onChange={this.onComponentTypeChanged} />
              <Select
                multiple={true}
                label='Components'
                options={this.state.componentOptions}
                isOptionSelected={
                  option => this.state.currentPlotModel.components.find(e => e.displayName === option.label) !== undefined
                }
                onChange={this.onComponentsSelected} />
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
            onClick={() => this.props.onSubmit(this.state.createdPlotModels)} />
        </DialogActions>
      </Dialog>
    );
  }

  onPlotNameChanged(item: string | Option<PlotModel>) {
    const newPlotModel = typeof item === 'string'
      ? this.state.createdPlotModels.find(e => e.name === item) || this._createDefaultPlotModel(item)
      : item.value;

    this.setState({
      currentPlotModel: newPlotModel,
      componentOptions: [],
      componentTypeOptions: [...this.state.componentTypeOptions]
    });
  }

  onComponentTypeChanged(option: Option<PlotModelComponentType>) {
    switch (option.value) {
      case PlotModelComponentType.POWER:
        this.setState({
          componentOptions: this._getComponentNameOptions(PlotModelComponentType.POWER)
        });
        break;
      case PlotModelComponentType.TAP:
        this.setState({
          componentOptions: this._getComponentNameOptions(PlotModelComponentType.TAP)
        });
        break;
      case PlotModelComponentType.VOLTAGE:
        this.setState({
          componentOptions: this._getComponentNameOptions(PlotModelComponentType.VOLTAGE)
        });
        break;
      default:
        break;
    }
    this.state.currentPlotModel.componentType = option.value;
  }

  private _getComponentNameOptions(targetType: PlotModelComponentType): Option<PlotModelComponent>[] {
    const options: Option<PlotModelComponent>[] = [];
    for (const measurement of this.props.modelDictionary.measurements)
      if (measurement.measurementType === targetType) {
        const id = targetType === PlotModelComponentType.VOLTAGE
          ? measurement.ConnectivityNode
          : measurement.ConductingEquipment_name;
        const newPlotModelComponent: PlotModelComponent = {
          id,
          phases: measurement.phases,
          displayName: `${id} (${measurement.phases})`
        };
        options.push(new Option(newPlotModelComponent.displayName, newPlotModelComponent));
      }
    return removeOptionsWithIdenticalLabel(options)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  onComponentsSelected(options: Option<PlotModelComponent>[]) {
    if (options.length !== 0) {
      const currentPlotModel = this.state.currentPlotModel;
      const createdPlotModels = this.state.createdPlotModels;
      const newCurrentPlotModel: PlotModel = {
        name: currentPlotModel.name,
        components: options.map(e => e.value),
        componentType: currentPlotModel.componentType
      };
      const updatedPlotModels = createdPlotModels.map(existingModel => {
        return existingModel !== currentPlotModel ? existingModel : newCurrentPlotModel;
      });
      // If the new plot model was not swapped in by the map call above
      // then we need to append it
      if (!updatedPlotModels.includes(newCurrentPlotModel))
        updatedPlotModels.push(newCurrentPlotModel);
      this.setState({
        createdPlotModels: updatedPlotModels,
        currentPlotModel: newCurrentPlotModel,
        allPlotModelOptions: updatedPlotModels.map(model => new Option(model.name, model))
      });
    } else {
      const updatedPlotModels = this.state.createdPlotModels.filter(model => model !== this.state.currentPlotModel);
      this.setState({
        currentPlotModel: this._createDefaultPlotModel(),
        allPlotModelOptions: toOptions(updatedPlotModels, model => model.name),
        createdPlotModels: updatedPlotModels
      });
    }
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
        componentTypeOptions: [...this.state.componentTypeOptions]
      });
    }
  }

  onPlotModelUpdated(updatedPlotModel: PlotModel) {
    if (updatedPlotModel.name === this.state.currentPlotModel.name) {
      const updatedPlotModels = this.state.createdPlotModels.map(model => {
        return model.name !== updatedPlotModel.name ? model : updatedPlotModel;
      });
      console.log(updatedPlotModel === this.state.currentPlotModel);
      this.setState({
        currentPlotModel: updatedPlotModel,
        allPlotModelOptions: toOptions(updatedPlotModels, model => model.name),
        createdPlotModels: updatedPlotModels,
        // Without this, the currently selected components do not get updated in 
        // the "Components" drop down for the current plot model
        componentOptions: [...this.state.componentOptions]
      });
    }
  }
}
