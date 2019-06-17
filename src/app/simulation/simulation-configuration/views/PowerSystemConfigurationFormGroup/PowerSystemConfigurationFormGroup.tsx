import * as React from 'react';

import { FormGroup, Select, Option } from '@shared/form';
import { FeederModel, FeederModelRegion, FeederModelLine } from '@shared/topology';
import { PowerSystemConfigurationFormGroupValue } from '../../models/PowerSystemConfigurationFormGroupValue';

import './PowerSystemConfigurationFormGroup.scss';

interface Props {
  feederModel: FeederModel;
  onChange: (value: PowerSystemConfigurationFormGroupValue) => void;
}

interface State {
  regionOptions: Option<FeederModelRegion>[];
  subregionOptions: Option<string>[];
  lineOptions: Option<FeederModelLine>[];
}

export class PowerSystemConfigurationFormGroup extends React.Component<Props, State> {

  readonly formValue: PowerSystemConfigurationFormGroupValue = {
    regionId: '',
    subregionId: '',
    lineId: '',
    simulationName: ''
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
          isOptionSelected={option => option.label.toLowerCase() === 'ieee'}
          onClear={this.onRegionSelectionCleared}
          onChange={this.onRegionSelectionChanged} />

        <Select
          multiple={false}
          label='Sub-geographical region name'
          options={this.state.subregionOptions}
          isOptionSelected={option => option.label.toLowerCase() === 'large'}
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
    this.setState({
      lineOptions: [],
      subregionOptions: []
    })
    this.props.onChange(this.formValue);
  }

  onRegionSelectionChanged(selectedOption: Option<FeederModelRegion>) {
    this.formValue.regionId = selectedOption.value.id;
    this.setState({
      subregionOptions: selectedOption.value.subregions.map(e => new Option(e.name, e.id)),
      lineOptions: []
    });

    this.props.onChange(this.formValue);
  }

  onSubregionSelectionCleared() {
    this.formValue.subregionId = '';
    this.formValue.lineId = '';
    this.setState({
      lineOptions: []
    })
    this.props.onChange(this.formValue);
  }

  onSubregionSelectionChanged(selectedOption: Option) {
    this.formValue.subregionId = selectedOption.value;
    this.setState({
      lineOptions: this.props.feederModel[this.formValue.regionId].lines
        .filter(line => line.subregionId === selectedOption.value)
        .map(line => new Option(line.name, line))
    });

    this.props.onChange(this.formValue);
  }

  onLineSelectionChanged(selectedOption: Option<{ id: string; name: string; }>) {
    this.formValue.lineId = selectedOption.value.id;
    this.formValue.simulationName = selectedOption.value.name;
    this.props.onChange(this.formValue);
  }

  onLineSelectionCleared() {
    this.formValue.lineId = '';
    this.props.onChange(this.formValue);
  }

}