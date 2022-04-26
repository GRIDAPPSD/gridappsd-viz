/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import { Subject, take, takeUntil } from 'rxjs';

import { StateStore } from '@client:common/state-store';
import { BasicButton, IconButton } from '@client:common/buttons';
import { Form, Select, FormControlModel, SelectionOptionBuilder, FormGroupModel, Checkbox } from '@client:common/form';
import { MeasurementType, ModelDictionaryComponent } from '@client:common/topology';
import { FilePickerService, FilePicker } from '@client:common/file-picker';
import { Notification } from '@client:common/overlay/notification';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';

import { SimulationVsTimeSeriesRequestConfigModel } from '../../models/SimulationVsTimeSeriesRequestConfigModel';

import './SimulationVsTimeSeries.light.scss';
import './SimulationVsTimeSeries.dark.scss';

interface Props {
  lineName: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  simulationIds: string[];
  onSubmit: (simulationConfiguration: any | null, simulationId: number, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: string) => void;
  onMRIDChanged: (mRID: string) => void;
}

interface State {
  modelDictionaryComponents: ModelDictionaryComponent[];
  lineNameOptionBuilder: SelectionOptionBuilder<string>;
  measurementTypeOptionBuilder: SelectionOptionBuilder<MeasurementType>;
  modelDictionaryComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent>;
  firstSimulationIdOptionBuilder: SelectionOptionBuilder<number>;
  disableSubmitButton: boolean;
  simulationConfigurationFileContentInState: any;
  selectedMenuOptions: SimulationVsTimeSeriesRequestConfigModel;
  showProgressIndicator: boolean;

  simulationConfigurationFileName: string;
  userSelectedSimulationIdFromDropDownMenu: number;
  fileUploaded: boolean;
}
export class SimulationVsTimeSeries extends Component<Props, State> {
  readonly selectedLineNameFormControl = new FormControlModel<string>(null);
  readonly selectedComponentTypeFormControl = new FormControlModel<string>(null);
  readonly useMagnitudeFormControl = new FormControlModel(false);
  readonly useAngleFormControl = new FormControlModel(false);
  // readonly selectedComponentFormControl = new FormControlModel<ModelDictionaryComponent>(null); // Need to update selectedComponentFormControl
  readonly selectedComponentFormControl = new FormControlModel([]);
  readonly selectedFirstSimulationIdFormControl = new FormControlModel<number>(null);
  readonly currentComparisonConfigFormGroup = this._createCurrentComparisonConfigFormGroupModel();

  readonly fileOutputDataMap = new Map<string, ModelDictionaryComponent>();

  private readonly _filePickerService = FilePickerService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      modelDictionaryComponents: [],
      lineNameOptionBuilder: new SelectionOptionBuilder(props.lineName),
      measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      firstSimulationIdOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      disableSubmitButton: true,
      selectedMenuOptions: {
        lineName: '',
        userSelectedSimulationId: null,
        componentType: '',
        useMagnitude: false,
        useAngle: false,
        // component: '',
        component: [], // Need to update component: []
        firstSimulationId: null
      },
      simulationConfigurationFileContentInState: {},
      fileUploaded: false,
      simulationConfigurationFileName: '',
      userSelectedSimulationIdFromDropDownMenu: null,
      showProgressIndicator: false
    };
    this.onUploadSimulationConfigurationFile = this.onUploadSimulationConfigurationFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  private _createCurrentComparisonConfigFormGroupModel() {
    const formGroupModel = new FormGroupModel({
      lineName: this.selectedLineNameFormControl,
      firstSimulationId: this.selectedFirstSimulationIdFormControl,
      componentType: this.selectedComponentTypeFormControl,
      useMagnitude: this.useMagnitudeFormControl,
      useAngle: this.useAngleFormControl,
      component: this.selectedComponentFormControl
    });

    this.selectedFirstSimulationIdFormControl.dependsOn(this.selectedLineNameFormControl);
    this.selectedComponentTypeFormControl.dependsOn(this.selectedFirstSimulationIdFormControl);
    this.useMagnitudeFormControl.dependsOn(this.selectedComponentTypeFormControl);
    this.useAngleFormControl.dependsOn(this.selectedComponentTypeFormControl);
    this.selectedComponentFormControl.dependsOn(this.selectedComponentTypeFormControl);

    return formGroupModel;
  }

  componentDidMount() {
    this.currentComparisonConfigFormGroup.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });
    this._processLineNameChanges();
    this._onFirstSimulationSelectionChange();
    this._onComponentSelectionChange();
    this._onUseMagnitudeSelectionChange();
    this._onUseAngleSelectionChange();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.simulationIds !== this.props.simulationIds || prevProps.lineName !== this.props.lineName) {
      this.setState({
        lineNameOptionBuilder: new SelectionOptionBuilder(this.props.lineName)
      });
    }
    if(prevState.modelDictionaryComponents.length === 0 || this.state.modelDictionaryComponents.length === 0) {
      this.selectedComponentFormControl.disable();
      this.useMagnitudeFormControl.disable();
      this.useAngleFormControl.disable();
    }
  }

  componentWillUnmount(): void {
    this.currentComparisonConfigFormGroup.cleanup();
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  private _processLineNameChanges() {
    this.selectedLineNameFormControl.valueChanges()
      .subscribe({
          next: selectedLineName => {
            if (selectedLineName) {
              const theSelectedLineNameMRID = this.props.lineNamesAndMRIDMap.get(selectedLineName);
              const matchingSimulationIds = this.props.mRIDAndSimulationIdsMapping.get(theSelectedLineNameMRID);
              if (this.props.lineNamesAndMRIDMap.has(selectedLineName) && matchingSimulationIds) {
                this.setState({
                  showProgressIndicator: true,
                  firstSimulationIdOptionBuilder: new SelectionOptionBuilder(matchingSimulationIds),
                  modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
                  selectedMenuOptions:{...this.state.selectedMenuOptions, lineName: selectedLineName}
                });
                this._stateStore.update({
                  modelDictionaryComponents: [],
                  modelDictionary: null
                });
                this.props.onMRIDChanged(theSelectedLineNameMRID);
                this._stateStore.select('modelDictionaryComponents')
                  .pipe(takeUntil(this._unsubscriber))
                  .subscribe({
                    next: componentDropdownMenuOptions => {
                        if(componentDropdownMenuOptions.length > 0){
                          this.setState({
                            showProgressIndicator: false,
                            modelDictionaryComponents: componentDropdownMenuOptions
                          }, ()=> this._onComponentTypeSelectionChange());
                        }
                      }
                    });
              } else {
                this.setState({
                  measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
                });
              }
            }
          }
      });
  }

  private _onFirstSimulationSelectionChange() {
    this.selectedFirstSimulationIdFormControl.valueChanges()
      .subscribe({
        next: selectedFirstSimulationId => {
          if (selectedFirstSimulationId) {
            this.setState({
              userSelectedSimulationIdFromDropDownMenu: selectedFirstSimulationId,
              selectedMenuOptions: {...this.state.selectedMenuOptions, firstSimulationId: selectedFirstSimulationId},
              measurementTypeOptionBuilder: new SelectionOptionBuilder (
                [
                  MeasurementType.POWER,
                  MeasurementType.TAP,
                  MeasurementType.VOLTAGE
                ],
                type => {
                  switch (type) {
                    case MeasurementType.POWER:
                      return 'Power';
                    case MeasurementType.TAP:
                      return 'Tap';
                    case MeasurementType.VOLTAGE:
                      return 'Voltage';
                    default:
                      return '';
                  }
                }
              )
            });
          }
        }
      });
  }

  private _onComponentTypeSelectionChange() {
    this.selectedComponentTypeFormControl.valueChanges()
      .subscribe({
        next: selectedComponentType => {
          this.useMagnitudeFormControl.reset();
          this.useAngleFormControl.reset();
          if (this.selectedComponentTypeFormControl.isValid()) {
            this.setState({
              modelDictionaryComponentOptionBuilder: new SelectionOptionBuilder(
                this.state.modelDictionaryComponents.filter(e => e.type === selectedComponentType),
                e => e.displayName
                ),
              selectedMenuOptions: {...this.state.selectedMenuOptions, componentType: selectedComponentType}
            });
          if (selectedComponentType === MeasurementType.TAP) {
            this.useMagnitudeFormControl.disable();
            this.useAngleFormControl.disable();
            } else {
              this.useMagnitudeFormControl.enable();
              this.useAngleFormControl.enable();
            }
          } else {
            this.useMagnitudeFormControl.disable();
            this.useAngleFormControl.disable();
            this.setState({
              modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  private _onComponentSelectionChange() {
    this.selectedComponentFormControl.valueChanges()
      .subscribe({
        next: (selectedComponent) => {
          if(this.selectedComponentFormControl.isValid()) {
            this.setState({
              selectedMenuOptions:{...this.state.selectedMenuOptions, component: selectedComponent}
            });
          }
        }
      });
  }

  private _onUseMagnitudeSelectionChange() {
    this.useMagnitudeFormControl.valueChanges()
      .subscribe({
        next: selectedCheckBoxValue => {
          this.setState({
            selectedMenuOptions: {...this.state.selectedMenuOptions, useMagnitude: selectedCheckBoxValue}
          });
        }
      });
  }

  private _onUseAngleSelectionChange() {
    this.useAngleFormControl.valueChanges()
      .subscribe({
        next: selectedCheckBoxValue => {
          this.setState({
            selectedMenuOptions: {...this.state.selectedMenuOptions, useAngle: selectedCheckBoxValue}
          });
        }
      });
  }

  onUploadSimulationConfigurationFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            simulationConfigurationFileContentInState: {},
            simulationConfigurationFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: fileContent => {
          if(!fileContent.test_config){
            Notification.open('Incorrect file structure, please refer to the documentation and edit file accordingly.');
          } else {
            fileContent.test_config['compareWithSimId'] = this.state.userSelectedSimulationIdFromDropDownMenu;
            fileContent.test_config['testType'] = 'simulation_vs_timeseries';
            this.setState({
              simulationConfigurationFileContentInState: fileContent,
              fileUploaded: true
            });
          }
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            simulationConfigurationFileContentInState: {}
          });
        }
      });
  }

  renderAdditionalMenus = () => {
    if(this.state.fileUploaded) {
      return (
        <>
          <Select
            label='Component type'
            selectedOptionFinder={type => type === this.currentComparisonConfigFormGroup.findControl('componentType').getValue()}
            selectionOptionBuilder={this.state.measurementTypeOptionBuilder}
            formControlModel={this.selectedComponentTypeFormControl} />
          <Checkbox
            label='Magnitude'
            name='useMagnitude'
            labelPosition='right'
            formControlModel={this.useMagnitudeFormControl} />
          <Checkbox
            label='Angle'
            name='useAngle'
            labelPosition='right'
            formControlModel={this.useAngleFormControl} />
          <Select
            multiple={true}
            maxNumOfSelection={5}
            label='Component'
            selectionOptionBuilder={this.state.modelDictionaryComponentOptionBuilder}
            formControlModel={this.selectedComponentFormControl} />
          <BasicButton
            type='positive'
            label='Submit'
            disabled={this.state.disableSubmitButton}
            onClick={this.onSubmit} />
        </>
      );
    }
    return null;
  };

  render() {
    return (
      <Form className='simulation-vs-time-series-form'>
        <Select
          label='Line name'
          selectionOptionBuilder={this.state.lineNameOptionBuilder}
          formControlModel={this.selectedLineNameFormControl} />
        <Select
          label='Simulation ID'
          selectionOptionBuilder={this.state.firstSimulationIdOptionBuilder}
          formControlModel={this.selectedFirstSimulationIdFormControl} />
        <div className='simulation-vs-time-series__file-upload'>
          <IconButton
            disabled={this.state.userSelectedSimulationIdFromDropDownMenu === null}
            icon='cloud_upload'
            label='Upload simulation configuration file'
            onClick={this.onUploadSimulationConfigurationFile} />
          <div className='simulation-vs-time-series__file-upload__file-name'>
            {this.state.simulationConfigurationFileName ? 'File uploaded: ' + this.state.simulationConfigurationFileName : ''}
          </div>
        </div>
        { this.renderAdditionalMenus() }
        { this.state.showProgressIndicator ? <ProgressIndicator show /> : null }
        <FilePicker />
      </Form>
    );
  }

  onSubmit() {
    const { lineName, componentType, useMagnitude, useAngle, component, firstSimulationId } = this.state.selectedMenuOptions;
    this.props.onSubmit(this.state.simulationConfigurationFileContentInState, firstSimulationId, lineName, componentType, useMagnitude, useAngle, component);
    this.setState({
      disableSubmitButton: true
    });
  }
}
