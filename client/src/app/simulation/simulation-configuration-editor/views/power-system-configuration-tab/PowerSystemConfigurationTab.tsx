import { Component } from 'react';

import { FormGroup, Select, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@client:common/form';
import { FeederModel, FeederModelRegion, FeederModelLine, FeederModelSubregion } from '@client:common/topology';
import { SimulationConfiguration } from '@client:common/simulation';

import { PowerSystemConfigurationModel } from '../../models/PowerSystemConfigurationModel';

import './PowerSystemConfigurationTab.light.scss';
import './PowerSystemConfigurationTab.dark.scss';

interface Props {
  parentFormGroupModel: FormGroupModel<PowerSystemConfigurationModel>;
  feederModel: FeederModel;
  powerSystemConfig: SimulationConfiguration['power_system_config'];
}

interface State {
  regionOptionBuilder: SelectionOptionBuilder<FeederModelRegion>;
  subregionOptionBuilder: SelectionOptionBuilder<FeederModelSubregion>;
  lineOptionBuilder: SelectionOptionBuilder<FeederModelLine>;
}

export class PowerSystemConfigurationTab extends Component<Props, State> {

  readonly regionFormControlModel = new FormControlModel<FeederModelRegion>(null);
  readonly subregionFormControlModel = new FormControlModel<FeederModelSubregion>(null);
  readonly lineNameFormControlModel = new FormControlModel<FeederModelLine>(null);

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

    this._setupPowerSystemConfigurationTabFormGroupModel();

  }

  private _setupPowerSystemConfigurationTabFormGroupModel() {
    this.props.parentFormGroupModel.setControl('region', this.regionFormControlModel);
    this.props.parentFormGroupModel.setControl('subregion', this.subregionFormControlModel);
    this.props.parentFormGroupModel.setControl('line', this.lineNameFormControlModel);
    this.subregionFormControlModel.dependsOn(this.regionFormControlModel);
    this.lineNameFormControlModel.dependsOn(this.subregionFormControlModel);
  }

  componentDidMount() {
    this._populateSubregionDropdownOnRegionSelectionChanges();
    this._populateLineNameDropdownOnSubregionSelectionChanges();
  }

  private _populateSubregionDropdownOnRegionSelectionChanges() {
    this.regionFormControlModel.valueChanges()
      .subscribe({
        next: selectedRegion => {
          if (selectedRegion) {
            this.setState({
              subregionOptionBuilder: new SelectionOptionBuilder(
                selectedRegion.subregions,
                subregion => subregion.name
              ),
              lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          } else {
            this.setState({
              subregionOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  private _populateLineNameDropdownOnSubregionSelectionChanges() {
    this.subregionFormControlModel.valueChanges()
      .subscribe({
        next: selectedSubregion => {
          if (selectedSubregion) {
            this.setState({
              lineOptionBuilder: new SelectionOptionBuilder(
                this.props.feederModel[this.regionFormControlModel.getValue().id].lines.filter(line => line.subregionId === selectedSubregion.id),
                line => line.name
              )
            });
          } else {
            this.setState({
              lineOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  render() {
    return (
      <FormGroup
        label=''
        className='power-system-configuration-tab'>
        <Select
          label='Geographical region name'
          formControlModel={this.regionFormControlModel}
          selectionOptionBuilder={this.state.regionOptionBuilder}
          selectedOptionFinder={
            region => region.id === this.props.powerSystemConfig.GeographicalRegion_name
          } />

        <Select
          label='Sub-geographical region name'
          formControlModel={this.subregionFormControlModel}
          selectionOptionBuilder={this.state.subregionOptionBuilder}
          selectedOptionFinder={
            subregion => subregion.id === this.props.powerSystemConfig.SubGeographicalRegion_name
          } />

        <Select
          label='Line name'
          formControlModel={this.lineNameFormControlModel}
          selectionOptionBuilder={this.state.lineOptionBuilder}
          selectedOptionFinder={line => line.id === this.props.powerSystemConfig.Line_name} />
      </FormGroup>
    );
  }

}
