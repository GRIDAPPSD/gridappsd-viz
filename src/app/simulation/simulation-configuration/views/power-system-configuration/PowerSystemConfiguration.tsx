import * as React from 'react';

import { FormGroup, Select, Option } from '@shared/form';
import { FeederModel, FeederModelRegion, FeederModelLine } from '@shared/topology';
import { PowerSystemConfigurationModel } from '../../models/PowerSystemConfigurationModel';

import './PowerSystemConfiguration.light.scss';
import './PowerSystemConfiguration.dark.scss';

interface Props {
  feederModel: FeederModel;
  onChange: (value: PowerSystemConfigurationModel) => void;
}

interface State {
  regionOptions: Option<FeederModelRegion>[];
  subregionOptions: Option<string>[];
  lineOptions: Option<FeederModelLine>[];
}

export class PowerSystemConfiguration extends React.Component<Props, State> {

  readonly formValue: PowerSystemConfigurationModel = {
    regionId: '',
    subregionId: '',
    lineId: '',
    simulationName: '',
    isValid: false
  };

  constructor(props: any) {
    super(props);
    this.state = {
      regionOptions: Object.keys(this.props.feederModel)
        .map(regionId => new Option(this.props.feederModel[regionId].name, this.props.feederModel[regionId])),
      subregionOptions: [],
      lineOptions: []
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
          multiple={false}
          options={this.state.regionOptions}
          selectedOptionFinder={option => option.label.toLowerCase() === 'ieee'}
          onClear={this.onRegionSelectionCleared}
          onChange={this.onRegionSelectionChanged} />

        <Select
          multiple={false}
          label='Sub-geographical region name'
          options={this.state.subregionOptions}
          selectedOptionFinder={option => option.label.toLowerCase() === 'large'}
          onClear={this.onSubregionSelectionCleared}
          onChange={this.onSubregionSelectionChanged} />

        <Select
          multiple={false}
          label='Line name'
          options={this.state.lineOptions}
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
      lineOptions: [],
      subregionOptions: []
    });
  }

  onRegionSelectionChanged(selectedOption: Option<FeederModelRegion>) {
    this.formValue.regionId = selectedOption.value.id;
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      subregionOptions: selectedOption.value.subregions.map(e => new Option(e.name, e.id)),
      lineOptions: []
    });
  }

  onSubregionSelectionCleared() {
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      lineOptions: []
    });
  }

  onSubregionSelectionChanged(selectedOption: Option) {
    this.formValue.subregionId = selectedOption.value;
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
    this.setState({
      lineOptions: this.props.feederModel[this.formValue.regionId].lines
        .filter(line => line.subregionId === selectedOption.value)
        .map(line => new Option(line.name, line))
    });
  }

  onLineSelectionChanged(selectedOption: Option<{ id: string; name: string; }>) {
    this.formValue.lineId = selectedOption.value.id;
    this.formValue.simulationName = selectedOption.value.name;
    this.formValue.isValid = true;
    this.props.onChange(this.formValue);
  }

  onLineSelectionCleared() {
    this.formValue.lineId = '';
    this.formValue.isValid = false;
    this.props.onChange(this.formValue);
  }

}
