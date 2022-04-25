/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import { Subject, take } from 'rxjs';

import { StateStore } from '@client:common/state-store';
import { FormControlModel, Form, Select, FormGroupModel, SelectionOptionBuilder, Checkbox } from '@client:common/form';
import { BasicButton, IconButton } from '@client:common/buttons';
import { ModelDictionaryComponent, MeasurementType } from '@client:common/topology';
import { Notification } from '@client:common/overlay/notification';
import { FilePickerService, FilePicker } from '@client:common/file-picker';

import { SimulationVsExpectedRequestConfigModel } from '../../models/SimulationVsExpectedRequestConfigModel';

import './SimulationVsExpected.light.scss';
import './SimulationVsExpected.dark.scss';

interface Props {
  modelDictionaryComponentsCaches: ModelDictionaryComponent[];
  lineName: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  simulationIds: string[];
  onSubmit: ( simulationConfiguration: any,
              expectedResults: any,
              lineName: string,
              componentType: string,
              useMagnitude: boolean,
              useAngle: boolean,
              component: string ) => void;
  onMRIDChanged: (mRID: string) => void;
}

interface State {
  fileOutputDataMapInState: Map<string, ModelDictionaryComponent>;
  lineNameOptionBuilder: SelectionOptionBuilder<string>;
  measurementTypeOptionBuilder: SelectionOptionBuilder<MeasurementType>;
  modelDictionaryComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent>;
  selectedMenuOptions: SimulationVsExpectedRequestConfigModel;

  expectedResultsFileName: string;
  eventsFileName: string;
  simulationConfigurationFileName: string;
  disableSubmitButton: boolean;

  expectedResultsFileUploaded: boolean;
  simConfigFileUploaded: boolean;
}

export class SimulationVsExpected extends Component<Props, State> {
  readonly selectedLineNameFormControl = new FormControlModel<string>(null);
  readonly selectedComponentTypeFormControl = new FormControlModel<string>(null);
  readonly useMagnitudeFormControl = new FormControlModel(false);
  readonly useAngleFormControl = new FormControlModel(false);
  readonly selectedComponentFormControl = new FormControlModel<ModelDictionaryComponent>(null);
  readonly currentComparisonConfigFormGroup = this._createCurrentComparisonConfigFormGroupModel();

  readonly fileOutputDataMap = new Map<string, ModelDictionaryComponent>();

  private readonly _filePickerService = FilePickerService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  private _expectedResults: any = {};
  private _simulationConfiguration: any = null;
  private _events: any[] = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      fileOutputDataMapInState: null,
      lineNameOptionBuilder: new SelectionOptionBuilder(props.lineName),
      measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      expectedResultsFileName: '',
      eventsFileName: '',
      simulationConfigurationFileName: '',
      disableSubmitButton: true,
      selectedMenuOptions: {
        lineName: '',
        userSelectedSimulationId: null,
        componentType: '',
        useMagnitude: false,
        useAngle: false,
        component: ''
      },
      expectedResultsFileUploaded: false,
      simConfigFileUploaded: false
    };

    this.onUploadExpectedResultsFile = this.onUploadExpectedResultsFile.bind(this);
    this.onUploadEventsFile = this.onUploadEventsFile.bind(this);
    this.onUploadSimulationConfigurationFile = this.onUploadSimulationConfigurationFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

  }

  private _createCurrentComparisonConfigFormGroupModel() {
    const formGroupModel = new FormGroupModel({
      lineName: this.selectedLineNameFormControl,
      componentType: this.selectedComponentTypeFormControl,
      useMagnitude: this.useMagnitudeFormControl,
      useAngle: this.useAngleFormControl,
      component: this.selectedComponentFormControl
    });

    this.selectedComponentTypeFormControl.dependsOn(this.selectedLineNameFormControl);
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
    this._onComponentTypeSelectionChange();
    this._onComponentSelectionChange();
    this._onUseMagnitudeSelectionChange();
    this._onUseAngleSelectionChange();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if(prevProps.simulationIds !== this.props.simulationIds || prevProps.lineName !== this.props.lineName) {
      this.setState({
        lineNameOptionBuilder: new SelectionOptionBuilder(this.props.lineName)
      });
    }
    if(prevState.fileOutputDataMapInState === null || this.state.fileOutputDataMapInState === null) {
      this.selectedComponentFormControl.disable();
      this.useMagnitudeFormControl.disable();
      this.useAngleFormControl.disable();
    }
  }

  componentWillUnmount() {
    this.currentComparisonConfigFormGroup.cleanup();
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  private _processLineNameChanges() {
    this.selectedLineNameFormControl.valueChanges()
      .subscribe({
        next: selectedLineName => {
          if(selectedLineName) {
           const theSelectedLineNameMRID = this.props.lineNamesAndMRIDMap.get(selectedLineName);
           const matchingSimulationIds = this.props.mRIDAndSimulationIdsMapping.get(theSelectedLineNameMRID);
            if(this.props.lineNamesAndMRIDMap.has(selectedLineName) && matchingSimulationIds) {
              this.setState({
                modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
                selectedMenuOptions:{...this.state.selectedMenuOptions, lineName: selectedLineName},
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
              this._stateStore.update({
                modelDictionaryComponents: [],
                modelDictionary: null
              });
              this.props.onMRIDChanged(theSelectedLineNameMRID);
            } else {
              this.setState({
                measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
              });
            }
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
          if (this.selectedComponentTypeFormControl.isValid() && this.state.fileOutputDataMapInState) {
            this.setState({
              modelDictionaryComponentOptionBuilder: new SelectionOptionBuilder(
                Array.from(this.state.fileOutputDataMapInState.values()).filter(e => e.type === selectedComponentType),
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

  onUploadExpectedResultsFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            expectedResultsFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: fileContent => {
          if(!fileContent.expectedResults) {
            Notification.open('Incorrect file structure, please refer to the documentation and edit file accordingly.');
          } else {
            this._expectedResults = fileContent.expectedResults;
            this.setState({
              fileOutputDataMapInState: this._populateFileOutputDataMap(fileContent),
              expectedResultsFileUploaded: true
            });
          }
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            disableSubmitButton: true,
            expectedResultsFileUploaded: false
          });
        }
      });
  }

  private _populateFileOutputDataMap(fileContent: any) {
    const outputResults = fileContent.expectedResults.output;
    const inputResults = fileContent.expectedResults.input;
    let outputMeasurementMRIDs: string[] = [];
    let inputMeasurementObjects: string[] = [];
    for(const timestamp in outputResults) {
      if(Object.prototype.hasOwnProperty.call(outputResults, timestamp)) {
        outputResults[timestamp].message.measurements.forEach((m: { measurement_mrid: string }) => {
          outputMeasurementMRIDs.push(m.measurement_mrid);
        });
      }
    }
    outputMeasurementMRIDs = [...new Set(outputMeasurementMRIDs)];
    for(const timestamp in inputResults) {
      if(Object.prototype.hasOwnProperty.call(inputResults, timestamp)) {
        inputResults[timestamp].message.measurements.forEach((m: { object: string }) => {
          inputMeasurementObjects.push(m.object);
        });
      }
    }
    inputMeasurementObjects = [...new Set(inputMeasurementObjects)];
    const modelDictionaryComponentsCaches = this.props.modelDictionaryComponentsCaches;
    for(const modelDict of modelDictionaryComponentsCaches) {
      modelDict.measurementMRIDs.forEach(element => {
        for(const mrid of outputMeasurementMRIDs) {
          if(element === mrid) {
            this.fileOutputDataMap.set(mrid, modelDict);
          }
        }
      });
    }
    return this.fileOutputDataMap;
  }

  onUploadEventsFile() {
    this._filePickerService.fileSelectionChanges()
      .pipe(take(1))
      .subscribe({
        next: file => {
          this.setState({
            eventsFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any[]>()
      .subscribe({
        next: events => {
          this._events = events;
          this.setState({
            disableSubmitButton: false
          });
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            disableSubmitButton: true
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
            simulationConfigurationFileName: file.name
          });
          this._filePickerService.clearSelection();
        }
      });

    this._filePickerService.open()
      .readFileAsJson<any>()
      .subscribe({
        next: (fileContent) => {
          if(!fileContent.simulation_config || !fileContent.power_system_config) {
            Notification.open('Incorrect file structure, please refer to the documentation and edit file accordingly.');
          } else {
            fileContent['test_config']['testType'] = 'simulation-vs-expected';
            this._simulationConfiguration = fileContent;
            this.setState({
              simConfigFileUploaded: true
            });
          }
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this._simulationConfiguration = null;
          this.setState({
            simConfigFileUploaded: false
          });
        }
      });
  }

  onSubmit() {
    const { lineName, componentType, useMagnitude, useAngle, component } = this.state.selectedMenuOptions;
    this.props.onSubmit(this._simulationConfiguration, this._expectedResults, lineName, componentType, useMagnitude, useAngle, component);
    this.setState({
      disableSubmitButton: true
    });
  }

  renderAdditionalMenus = () => {
    if(this.state.expectedResultsFileUploaded && this.state.simConfigFileUploaded) {
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
      <Form
      className='simulation-vs-expected'
      formGroupModel={this.currentComparisonConfigFormGroup} >
          <Select
            label='Line Name'
            selectionOptionBuilder={this.state.lineNameOptionBuilder}
            formControlModel={this.selectedLineNameFormControl}
          />
          <div className='simulation-vs-expected__file-upload'>
            <IconButton
              icon='cloud_upload'
              label='Upload expected results file'
              onClick={this.onUploadExpectedResultsFile} />
            <div className='simulation-vs-expected__file-upload__file-name'>
              {this.state.expectedResultsFileName ? 'File uploaded: ' + this.state.expectedResultsFileName : ''}
            </div>
          </div>
          <div className='simulation-vs-expected__file-upload'>
            <IconButton
              icon='cloud_upload'
              label='Upload events file'
              onClick={this.onUploadEventsFile} />
            <div className='simulation-vs-expected__file-upload__file-name'>
              {this.state.eventsFileName ? 'File uploaded: ' + this.state.eventsFileName : ''}
            </div>
          </div>
          <div className='simulation-vs-expected__file-upload'>
            <IconButton
              icon='cloud_upload'
              label='Upload simulation configuration file'
              onClick={this.onUploadSimulationConfigurationFile} />
            <div className='simulation-vs-expected__file-upload__file-name'>
              {this.state.simulationConfigurationFileName ? 'File uploaded: ' + this.state.simulationConfigurationFileName : ''}
            </div>
          </div>
          {this.renderAdditionalMenus()}
        <FilePicker />
      </Form>
    );
  }

}
