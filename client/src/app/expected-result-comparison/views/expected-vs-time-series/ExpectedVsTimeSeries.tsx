import { Component } from 'react';
import { Subject, take, takeUntil } from 'rxjs';

import { StateStore } from '@client:common/state-store';
import { BasicButton, IconButton } from '@client:common/buttons';
import { Form, SelectionOptionBuilder, FormGroupModel, FormControlModel, Select, Checkbox } from '@client:common/form';
import { MeasurementType, ModelDictionaryComponent } from '@client:common/topology';
import { Notification } from '@client:common/overlay/notification';
import { FilePickerService, FilePicker } from '@client:common/file-picker';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';

import { ExpectedVsTimeSeriesRequestConfigModel } from '../../models/ExpectedVsTimeSeriesRequestConfigModel';

import './ExpectedVsTimeSeries.light.scss';
import './ExpectedVsTimeSeries.dark.scss';

interface Props {
  lineName: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  simulationIds: string[];
  onSubmit: (expectedResults: any, simulationId: number, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: string) => void;
  onMRIDChanged: (mRID: string) => void;
}

interface State {
  modelDictionaryComponents: ModelDictionaryComponent[];
  lineNameOptionBuilder: SelectionOptionBuilder<string>;
  measurementTypeOptionBuilder: SelectionOptionBuilder<MeasurementType>;
  modelDictionaryComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent>;
  firstSimulationIdOptionBuilder: SelectionOptionBuilder<number>;
  disableSubmitButton: boolean;
  selectedMenuOptions: ExpectedVsTimeSeriesRequestConfigModel;
  simIdFlag: number;

  expectedResultsFileName: string;
  showProgressIndicator: boolean;
}

export class ExpectedVsTimeSeries extends Component<Props, State> {
  readonly selectedLineNameFormControl = new FormControlModel<string>(null);
  readonly selectedComponentTypeFormControl = new FormControlModel(MeasurementType.NONE);
  readonly useMagnitudeFormControl = new FormControlModel(false);
  readonly useAngleFormControl = new FormControlModel(false);
  readonly selectedComponentFormControl = new FormControlModel<ModelDictionaryComponent>(null);
  readonly selectedFirstSimulationIdFormControl = new FormControlModel<number>(null);
  readonly currentComparisonConfigFormGroup = this._createCurrentComparisonConfigFormGroupModel();

  private readonly _filePickerService = FilePickerService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  private _expectedResults: any = {};

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
        component: '',
        firstSimulationId: null
      },
      simIdFlag: null,
      expectedResultsFileName: '',
      showProgressIndicator: false
    };

    this.onUploadExpectedResultsFile = this.onUploadExpectedResultsFile.bind(this);
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
    this._onLineNameChange();
    this._processLineNameChanges();
    this._onComponentSelectionChange();
    this._onUseMagnitudeSelectionChange();
    this._onUseAngleSelectionChange();
    this._onFirstSimulationSelectionChange();
  }

  private _onLineNameChange() {
    this.selectedLineNameFormControl.valueChanges()
      .subscribe({
        next: () => {
          if(this.selectedLineNameFormControl.isValid()) {
            this.setState({
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
              ),
              modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          } else {
            this.setState({
              measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  private _processLineNameChanges() {
    this.currentComparisonConfigFormGroup.findControl('lineName')
      .valueChanges()
      .subscribe({
        next: selectedLineName => {
          if(selectedLineName) {
           const theSelectedLineNameMRID = this.props.lineNamesAndMRIDMap.get(selectedLineName);
           const matchingSimulationIds = this.props.mRIDAndSimulationIdsMapping.get(theSelectedLineNameMRID);
            if(this.props.lineNamesAndMRIDMap.has(selectedLineName) && matchingSimulationIds) {
              this.setState({
                showProgressIndicator: true,
                firstSimulationIdOptionBuilder: new SelectionOptionBuilder(matchingSimulationIds)
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
                        modelDictionaryComponents: componentDropdownMenuOptions,
                        selectedMenuOptions:{...this.state.selectedMenuOptions, lineName: selectedLineName}
                      }, ()=> this._onComponentTypeSelectionChange());
                    }
                  }
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

  private _onFirstSimulationSelectionChange() {
    this.selectedFirstSimulationIdFormControl.valueChanges()
      .subscribe({
        next: selectedFirstSimulationId => {
          this.setState({
            simIdFlag: selectedFirstSimulationId,
            selectedMenuOptions: {...this.state.selectedMenuOptions, firstSimulationId: selectedFirstSimulationId}
          });
        }
      });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if(prevProps.simulationIds !== this.props.simulationIds || prevProps.lineName !== this.props.lineName) {
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

  componentWillUnmount() {
    this.currentComparisonConfigFormGroup.cleanup();
    this._unsubscriber.next();
    this._unsubscriber.complete();
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
          fileContent.compareWithSimId = this.state.simIdFlag;
          this._expectedResults = this._processUploadedFile(fileContent);
        },
        error: errorMessage => {
          Notification.open(errorMessage);
          this.setState({
            disableSubmitButton: true
          });
        }
      });
  }

  private _processUploadedFile(fileContent: any) {
    const expectedResults = fileContent.expectedResults;
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
    return expectedResults;
  }

  onSubmit() {
    const { lineName, componentType, useMagnitude, useAngle, component, firstSimulationId } = this.state.selectedMenuOptions;
    this.props.onSubmit(this._expectedResults, firstSimulationId, lineName, componentType, useMagnitude, useAngle, component);
    this.setState({
      disableSubmitButton: true
    });
  }

  render() {
    return (
      <Form
        className='expected-vs-time-series'
        formGroupModel={this.currentComparisonConfigFormGroup} >
        <Select
          label='Line name'
          selectionOptionBuilder={this.state.lineNameOptionBuilder}
          formControlModel={this.selectedLineNameFormControl} />
        <Select
          label='First simulation ID'
          selectionOptionBuilder={this.state.firstSimulationIdOptionBuilder}
          formControlModel={this.selectedFirstSimulationIdFormControl} />
        <div className='expected-vs-time-series__file-upload'>
          <IconButton
            disabled={this.state.simIdFlag === null}
            icon='cloud_upload'
            label='Upload expected results file'
            onClick={this.onUploadExpectedResultsFile} />
          <div className='expected-vs-time-series__file-upload__file-name'>
            {this.state.expectedResultsFileName ? 'File uploaded: ' + this.state.expectedResultsFileName : ''}
          </div>
        </div>
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
            {
          this.state.showProgressIndicator ? <ProgressIndicator show /> : null
        }
          <FilePicker />
      </Form>
    );
  }

}
