/* eslint-disable no-console */

import { Component } from 'react';
import { Subject, takeUntil } from 'rxjs';

import { StompClientService } from '@client:common/StompClientService';
import { StateStore } from '@client:common/state-store';
import { Form, SelectionOptionBuilder, FormGroupModel, FormControlModel, Select, Checkbox } from '@client:common/form';
import { MeasurementType, ModelDictionaryComponent } from '@client:common/topology';
import { BasicButton } from '@client:common/buttons';

import './TimeSeriesVsTimeSeries.light.scss';
import './TimeSeriesVsTimeSeries.dark.scss';

interface Props {
  lineName: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  /*
  lineNamesAndMRIDMap:
    0: {"acep_psil" => "_77966920-E1EC-EE8A-23EE-4EFD23B205BD"}
    1: {"final9500node" => "_EE71F6C9-56F0-4167-A14E-7F4C71F10EAA"}
    2: {"ieee123" => "_C1C3E687-6FFD-C753-582B-632A27E28507"}
    3: {"ieee123pv" => "_E407CBB6-8C8D-9BC9-589C-AB83FBF0826D"}
    4: {"ieee13nodeckt" => "_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62"}
    5: {"ieee13nodecktassets" => "_5B816B93-7A5F-B64C-8460-47C17D6E4B0F"}
    6: {"ieee13ochre" => "_13AD8E07-3BF9-A4E2-CB8F-C3722F837B62"}
    7: {"ieee8500" => "_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3"}
    8: {"test9500new" => "_AAE94E4A-2465-6F5E-37B1-3E72183A4E44"}
    9: {"ieee123transactive" => "_503D6E20-F499-4CC7-8051-971E23D0BF79"}
    10: {"j1" => "_67AB291F-DCCD-31B7-B499-338206B9828F"}
    11: {"sourceckt" => "_9CE150A8-8CC5-A0F9-B67E-BBD8C79D3095"}
  */
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  /*
  mRIDAndSimulationIdsMapping:
    process_id is the simulationID, model_id is the mRID for each simulation
    0: {process_id: '1129310468', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    1: {process_id: '1399723613', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    2: {process_id: '189543016', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    3: {process_id: '164811834', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    4: {process_id: '1062757047', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    5: {process_id: '1208333541', model_id: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62'}
    6: {process_id: '1968174895', model_id: '_5B816B93-7A5F-B64C-8460-47C17D6E4B0F'}
    7: {process_id: '588091696', model_id: '_5B816B93-7A5F-B64C-8460-47C17D6E4B0F'}
  */
  simulationIds: string[];
  onSubmit: (lineName: string, componentType: string, firstSimulationId: number, secondSimulationId: number) => void;
  onMRIDChanged: (mRID: string) => void;
}

interface State {
  modelDictionaryComponents: ModelDictionaryComponent[];
  lineNameOptionBuilder: SelectionOptionBuilder<string>; // line name
  measurementTypeOptionBuilder: SelectionOptionBuilder<MeasurementType>; // componentType
  modelDictionaryComponentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent>; // component
  firstSimulationIdOptionBuilder: SelectionOptionBuilder<number>; // first simulation id
  secondSimulationIdOptionBuilder: SelectionOptionBuilder<number>; // second simulation id
  disableSubmitButton: boolean;
  existingSimulationIds: string[];
}

export class TimeSeriesVsTimeSeries extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();

  readonly selectedLineNameFormControl = new FormControlModel<string>(null);
  readonly selectedComponentTypeFormControl = new FormControlModel(MeasurementType.NONE);
  readonly useMagnitudeFormControl = new FormControlModel(false);
  readonly useAngleFormControl = new FormControlModel(false);
  readonly selectedComponentFormControl = new FormControlModel<ModelDictionaryComponent>(null);
  readonly selectedFirstSimulationIdFormControl = new FormControlModel<number>(null);
  readonly selectedSecondSimulationIdFormControl = new FormControlModel<number>(null);

  readonly currentComparisonConfigFormGroup = this._createCurrentComparisonConfigFormGroupModel();

  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      modelDictionaryComponents: [],
      lineNameOptionBuilder: new SelectionOptionBuilder(props.lineName), // line Name[]
      measurementTypeOptionBuilder: SelectionOptionBuilder.defaultBuilder(), // componenty type
      modelDictionaryComponentOptionBuilder: SelectionOptionBuilder.defaultBuilder(), // component
      firstSimulationIdOptionBuilder: SelectionOptionBuilder.defaultBuilder(), // first simulation id
      secondSimulationIdOptionBuilder: SelectionOptionBuilder.defaultBuilder(), // second simulation id
      disableSubmitButton: true,
      existingSimulationIds: []
    };

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
      this._onComponentTypeChange();
      this._onComponentChange();

      this._processLineNameChanges();
  }

  private _onLineNameChange() { // Once lineName changes, then change the componentType
    this.selectedLineNameFormControl.valueChanges()
      .subscribe({
        next: () => {
          if(this.selectedLineNameFormControl.isValid()) {
            this.setState({
              measurementTypeOptionBuilder: new SelectionOptionBuilder ( // componenty type
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
              this.props.onMRIDChanged(this.props.lineNamesAndMRIDMap.get(selectedLineName));
              this._stateStore.select('modelDictionaryComponents')
                .pipe(takeUntil(this._unsubscriber))
                .subscribe({
                  next: selectedModelDictionaryComponents => {
                    if(selectedModelDictionaryComponents.length > 0){
                      // 🔥🔥🔥🔥🔥🔥🔥🔥🔥Now we got the modelDictionaryComponents based on the selected lineName!!!!🔥🔥🔥🔥🔥🔥
                      this.setState({
                        modelDictionaryComponents: selectedModelDictionaryComponents
                      });
                    }
                  }
                });
            }
          }
        }
      });
  }

  private _onComponentTypeChange() {
    this.selectedComponentTypeFormControl.valueChanges()
      .subscribe({
        next: selectedType => {
          this.useMagnitudeFormControl.reset();
          this.useAngleFormControl.reset();
          if (this.selectedComponentTypeFormControl.isValid()) {
            this.setState({
              modelDictionaryComponentOptionBuilder: new SelectionOptionBuilder(
                this.state.modelDictionaryComponents.filter(e => e.type === selectedType),
                e => e.displayName
              )
              // phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder() // need to include all the phases
            });
            if (selectedType === MeasurementType.TAP) {
              this.useMagnitudeFormControl.disable();
              this.useAngleFormControl.disable();
            } else {
              this.useMagnitudeFormControl.enable();
              this.useAngleFormControl.enable();
            }
          } else {
            this.useMagnitudeFormControl.disable();
            this.useAngleFormControl.disable();
          }
        }
      });
  }

  private _onComponentChange() {
    this.selectedComponentFormControl.valueChanges()
      .subscribe({
        next: () => {
          if(this.selectedComponentFormControl.isValid()) {
            const selectedLineName = this.selectedLineNameFormControl.getValue();
            const theSelectedLineNameMRID = this.props.lineNamesAndMRIDMap.get(selectedLineName);
            const matchingSimulationIds = this.props.mRIDAndSimulationIdsMapping.get(theSelectedLineNameMRID);
            this.setState({
              firstSimulationIdOptionBuilder: new SelectionOptionBuilder(matchingSimulationIds),
              secondSimulationIdOptionBuilder: new SelectionOptionBuilder(matchingSimulationIds)
            });
          }
        }
      });
  }

  componentDidUpdate(prevProps: Props) {
    if(prevProps.simulationIds !== this.props.simulationIds || prevProps.lineName !== this.props.lineName) {
      this.setState({
        lineNameOptionBuilder: new SelectionOptionBuilder(this.props.lineName)
      });
    }
  }

  componentWillUnmount() {
    this.currentComparisonConfigFormGroup.cleanup();
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  private _createCurrentComparisonConfigFormGroupModel() {
    const formGroupModel = new FormGroupModel({
      lineName: this.selectedLineNameFormControl,
      componentType: this.selectedComponentTypeFormControl,
      useMagnitude: this.useMagnitudeFormControl,
      useAngle: this.useAngleFormControl,
      component: this.selectedComponentFormControl,
      firstSimulationId: this.selectedFirstSimulationIdFormControl,
      secondSimulationId: this.selectedSecondSimulationIdFormControl
    });

    // componentType depends on lineName
    this.selectedComponentTypeFormControl.dependsOn(formGroupModel.findControl('lineName'));

    // useMagnitude checkbox depends on componentType
    this.useMagnitudeFormControl.dependsOn(formGroupModel.findControl('componentType'));

    // useAngle checkbox depends on componentType
    this.useAngleFormControl.dependsOn(formGroupModel.findControl('componentType'));

    // component depends on componentType
    this.selectedComponentFormControl.dependsOn(formGroupModel.findControl('componentType'));

    // firstSimulationId depends on component
    this.selectedFirstSimulationIdFormControl.dependsOn(formGroupModel.findControl('component'));

    // secondSimulationId depends on firstSimulationId
    this.selectedSecondSimulationIdFormControl.dependsOn(formGroupModel.findControl('firstSimulationId'));

    return formGroupModel;
  }

  render() {
    return (
      <Form
        className='time-series-vs-time-series-form'
        formGroupModel={this.currentComparisonConfigFormGroup} >
        <Select
          label='Line name'
          selectionOptionBuilder={this.state.lineNameOptionBuilder}
          // formControlModel={this.selectedLineNameFormControl} />
          formControlModel={this.currentComparisonConfigFormGroup.findControl('lineName')} />
        <Select
          label='Component type'
          selectedOptionFinder={type => type === this.currentComparisonConfigFormGroup.findControl('componentType').getValue()}
          selectionOptionBuilder={this.state.measurementTypeOptionBuilder}
          formControlModel={this.currentComparisonConfigFormGroup.findControl('componentType')} />
        <Checkbox
          label='Magnitude'
          name='useMagnitude'
          labelPosition='right'
          formControlModel={this.currentComparisonConfigFormGroup.findControl('useMagnitude')} />
        <Checkbox
          label='Angle'
          name='useAngle'
          labelPosition='right'
          formControlModel={this.currentComparisonConfigFormGroup.findControl('useAngle')} />
        <Select
          label='Component'
          selectionOptionBuilder={this.state.modelDictionaryComponentOptionBuilder}
          // formControlModel={this.selectedComponentFormControl} />
          formControlModel={this.currentComparisonConfigFormGroup.findControl('component')} />
        <Select
          label='First simulation ID'
          selectionOptionBuilder={this.state.firstSimulationIdOptionBuilder}
          formControlModel={this.currentComparisonConfigFormGroup.findControl('firstSimulationId')} />
        <Select
          label='Second simulation ID'
          selectionOptionBuilder={this.state.secondSimulationIdOptionBuilder}
          formControlModel={this.currentComparisonConfigFormGroup.findControl('secondSimulationId')} />
        <BasicButton
          type='positive'
          label='Submit'
          disabled={this.state.disableSubmitButton}
          onClick={this.onSubmit} />
      </Form>
    );
  }

  onSubmit() {
    const formValue = this.currentComparisonConfigFormGroup.getValue();
    this.props.onSubmit(formValue.lineName, formValue.componentType, formValue.firstSimulationId, formValue.secondSimulationId);
    this.setState({
      disableSubmitButton: true
    });
  }

}



// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================

// import { Component } from 'react';

// import { Form, SelectionOptionBuilder, FormGroupModel, FormControlModel, Select } from '@client:common/form';
// import { BasicButton } from '@client:common/buttons';

// import './TimeSeriesVsTimeSeries.light.scss';
// import './TimeSeriesVsTimeSeries.dark.scss';

// interface Props {
//   lineNames: string[];
//   componentType: string[];
//   simulationIds: string[];
//   onSubmit: (firstSimulationId: number, secondSimulationId: number) => void;
// }

// interface State {
//   lineNameOptionBuilder: SelectionOptionBuilder<string>;
//   componentTypeOptionBuilder: SelectionOptionBuilder<string>;
//   firstSimulationIdOptionBuilder: SelectionOptionBuilder<string>;
//   secondSimulationIdOptionBuilder: SelectionOptionBuilder<string>;
//   disableSubmitButton: boolean;
// }

// export class TimeSeriesVsTimeSeries extends Component<Props, State> {

//   readonly formGroup = new FormGroupModel({
//     lineName: new FormControlModel(''),
//     componentType: new FormControlModel(''),
//     firstSimulationId: new FormControlModel(''),
//     secondSimulationId: new FormControlModel('')
//   });

//   constructor(props: Props) {
//     super(props);

//     this.state = {
//       lineNameOptionBuilder: new SelectionOptionBuilder(props.lineNames),
//       componentTypeOptionBuilder: new SelectionOptionBuilder(props.componentType),
//       firstSimulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
//       secondSimulationIdOptionBuilder: new SelectionOptionBuilder(props.simulationIds),
//       disableSubmitButton: true
//     };

//     this.onSubmit = this.onSubmit.bind(this);

//   }

//   componentDidMount() {
//     this.formGroup.validityChanges()
//       .subscribe({
//         next: isValid => {
//           this.setState({
//             disableSubmitButton: !isValid
//           });
//         }
//       });
//   }

//   componentDidUpdate(prevProps: Props) {
//     if (prevProps.simulationIds !== this.props.simulationIds || prevProps.lineNames !== this.props.lineNames) {
//       this.setState({
//         lineNameOptionBuilder: new SelectionOptionBuilder(this.props.lineNames),
//         firstSimulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds),
//         secondSimulationIdOptionBuilder: new SelectionOptionBuilder(this.props.simulationIds)
//       });
//     }
//   }

//   componentWillUnmount() {
//     this.formGroup.cleanup();
//   }

//   render() {
//     return (
//       <Form className='time-series-vs-time-series-form'>
//         <Select
//           label='Line Name'
//           selectionOptionBuilder={this.state.lineNameOptionBuilder}
//           formControlModel={this.formGroup.findControl('lineName')} />
//         <Select
//           label='Component Type'
//           selectionOptionBuilder={this.state.componentTypeOptionBuilder}
//           formControlModel={this.formGroup.findControl('componentType')} />
        // <Select
        //   label='First simulation ID'
        //   selectionOptionBuilder={this.state.firstSimulationIdOptionBuilder}
        //   formControlModel={this.formGroup.findControl('firstSimulationId')} />
        // <Select
        //   label='Second simulation ID'
        //   selectionOptionBuilder={this.state.secondSimulationIdOptionBuilder}
        //   formControlModel={this.formGroup.findControl('secondSimulationId')} />
//         <BasicButton
//           type='positive'
//           label='Submit'
//           disabled={this.state.disableSubmitButton}
//           onClick={this.onSubmit} />
//       </Form>
//     );
//   }

//   onSubmit() {
//     const formValue = this.formGroup.getValue();
//     this.props.onSubmit(+formValue.firstSimulationId, +formValue.secondSimulationId);
//     this.setState({
//       disableSubmitButton: true
//     });
//   }

// }

