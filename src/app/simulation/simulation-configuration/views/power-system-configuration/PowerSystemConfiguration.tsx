import * as React from 'react';

import { FormGroup, Select, SelectionOptionBuilder } from '@shared/form';
import { FeederModel, FeederModelRegion, FeederModelLine, FeederModelSubregion } from '@shared/topology';
import { PowerSystemConfigurationModel } from '../../models/PowerSystemConfigurationModel';
import { SimulationConfiguration } from '@shared/simulation';

import './PowerSystemConfiguration.light.scss';
import './PowerSystemConfiguration.dark.scss';

interface Props {
  feederModel: FeederModel;
  powerSystemConfig: SimulationConfiguration['power_system_config'];
  onChange: (value: PowerSystemConfigurationModel) => void;
}

interface State {
  regionOptionBuilder: SelectionOptionBuilder<FeederModelRegion>;
  subregionOptionBuilder: SelectionOptionBuilder<FeederModelSubregion>;
  lineOptionBuilder: SelectionOptionBuilder<FeederModelLine>;
}

export class PowerSystemConfiguration extends React.Component<Props, State> {

  readonly formValue: PowerSystemConfigurationModel = {
    regionId: '',
    subregionId: '',
    lineId: '',
    simulationName: '',
    isValid: false
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      regionOptionBuilder: new SelectionOptionBuilder(
        Object.values(this.props.feederModel),
        feederRegion => feederRegion.name
      ),
      subregionOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    };
    this.onRegionSelectionCleared = this.onRegionSelectionCleared.bind(this);
    this.onRegionSelectionChanged = this.onRegionSelectionChanged.bind(this);
    this.onSubregionSelectionCleared = this.onSubregionSelectionCleared.bind(this);
    this.onSubregionSelectionChanged = this.onSubregionSelectionChanged.bind(this);
    this.onLineSelectionCleared = this.onLineSelectionCleared.bind(this);
    this.onLineSelectionChanged = this.onLineSelectionChanged.bind(this);
  }

  render() {
    return (
      <FormGroup label=''>
        <Select
          label='Geographical region name'
          selectionOptionBuilder={this.state.regionOptionBuilder}
          selectedOptionFinder={
            region => region.id === this.props.powerSystemConfig.GeographicalRegion_name
          }
          onClear={this.onRegionSelectionCleared}
          onChange={this.onRegionSelectionChanged} />

        <Select
          label='Sub-geographical region name'
          selectionOptionBuilder={this.state.subregionOptionBuilder}
          selectedOptionFinder={
            subregion => subregion.id === this.props.powerSystemConfig.SubGeographicalRegion_name
          }
          onClear={this.onSubregionSelectionCleared}
          onChange={this.onSubregionSelectionChanged} />

        <Select
          label='Line name'
          selectionOptionBuilder={this.state.lineOptionBuilder}
          selectedOptionFinder={
            line => line.id === this.props.powerSystemConfig.Line_name
          }
          onClear={this.onLineSelectionCleared}
          onChange={this.onLineSelectionChanged} />
      </FormGroup>
    );
  }

  onRegionSelectionCleared() {
    this.formValue.regionId = '';
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      lineOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      subregionOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
  }

  onRegionSelectionChanged(selectedFeederModelRegion: FeederModelRegion) {
    this.formValue.regionId = selectedFeederModelRegion.id;
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      subregionOptionBuilder: new SelectionOptionBuilder(
        selectedFeederModelRegion.subregions,
        subregion => subregion.name
      ),
      lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
  }

  onSubregionSelectionCleared() {
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
  }

  onSubregionSelectionChanged(selectedSubregion: FeederModelSubregion) {
    this.formValue.subregionId = selectedSubregion.id;
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      lineOptionBuilder: new SelectionOptionBuilder(
        this.props.feederModel[this.formValue.regionId].lines.filter(line => line.subregionId === selectedSubregion.id),
        line => line.name
      )
    });
  }

  onLineSelectionChanged(selectedLine: FeederModelLine) {
    this.formValue.lineId = selectedLine.id;
    this.formValue.simulationName = selectedLine.name;
    this.formValue.isValid = true;
    this.props.onChange(this.formValue);
  }

  onLineSelectionCleared() {
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
  }

}
