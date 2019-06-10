import * as React from 'react';

import { FormGroup, Select, Option } from '@shared/form';
import { FeederModel } from '@shared/topology';
import { PowerSystemConfigurationFormGroupValue } from '../../models/PowerSystemConfigurationFormGroupValue';

import './PowerSystemConfigurationFormGroup.scss';

interface Props {
  feederModels: FeederModel;
  onChange: (value: PowerSystemConfigurationFormGroupValue) => void;
}

interface State {
  regionNameOptions: Option<string>[];
  subregionNameOptions: Option<string>[];
  lineNameOptions: Option<{ name: string; mRID: string; index: number }>[];
}

export class PowerSystemConfigurationFormGroup extends React.Component<Props, State> {

  readonly formValue: PowerSystemConfigurationFormGroupValue = {
    geographicalRegionId: '_79C9D814-3CE0-DC11-534D-BDA1AF949810', // pnnl
    subGeographicalRegionId: '_1CD7D2EE-3C91-3248-5662-A43EFEFAC224', //large
    lineName: '',
    simulationName: ''
  };

  constructor(props: any) {
    super(props);
    this.state = {
      regionNameOptions: this.props.feederModels.regions.map(region => new Option(region.regionName, region.regionID)),
      subregionNameOptions: this.props.feederModels.subregions.map(e => new Option(e.subregionName, e.subregionID)),
      lineNameOptions: this.props.feederModels.lines.map(line => new Option(line.name, line))
    };

    this.onRegionChanged = this.onRegionChanged.bind(this);
    this.onSubRegionChanged = this.onSubRegionChanged.bind(this);
    this.onLineNameChanged = this.onLineNameChanged.bind(this);
    this.onLineNameCleared = this.onLineNameCleared.bind(this);
  }

  render() {
    return (
      <FormGroup label=''>
        <Select
          label='Geographical region name'
          multiple={false}
          options={this.state.regionNameOptions}
          isOptionSelected={option => option.value === this.formValue.geographicalRegionId}
          onChange={this.onRegionChanged} />

        <Select
          multiple={false}
          label='Sub-geographical region name'
          options={this.state.subregionNameOptions}
          isOptionSelected={option => option.value === this.formValue.subGeographicalRegionId}
          onChange={this.onSubRegionChanged} />

        <Select
          multiple={false}
          label='Line name'
          options={this.state.lineNameOptions}
          onClear={this.onLineNameCleared}
          onChange={this.onLineNameChanged} />
      </FormGroup>
    );
  }

  onRegionChanged(selectedOption: Option) {
    this.formValue.geographicalRegionId = selectedOption.value;
    this.props.onChange(this.formValue);
  }

  onSubRegionChanged(selectedOption: Option) {
    this.formValue.subGeographicalRegionId = selectedOption.value;
    this.props.onChange(this.formValue);
  }

  onLineNameChanged(selectedOption: Option<{ mRID: string; name: string; }>) {
    this.formValue.lineName = selectedOption.value.mRID;
    this.formValue.simulationName = selectedOption.value.name;
    this.props.onChange(this.formValue);
  }

  onLineNameCleared() {
    this.formValue.lineName = '';
    this.props.onChange(this.formValue);
  }

}