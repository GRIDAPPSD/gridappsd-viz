import { Component } from 'react';
import { filter } from 'rxjs/operators';

import { FormGroup, Input, FormGroupModel, FormControlModel, FormArrayModel } from '@client:common/form';
import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';
import { CommOutageEvent, CommOutageEventInputListItem, CommOutageEventOutputListItem, FaultEvent, ScheduledCommandEvent } from '@client:common/test-manager';
import { Validators, Validator } from '@client:common/form/validation';
import { download, DownloadType, generateUniqueId } from '@client:common/misc';
import { DateTimeService } from '@client:common/DateTimeService';
import { ModelDictionary, ModelDictionaryComponent } from '@client:common/topology';
import { FilePicker, FilePickerService } from '@client:common/file-picker';
import { RadioButtonGroup, RadioButton } from '@client:common/form/radio';
import { SimulationConfiguration } from '@client:common/simulation';

import { TestConfigurationModel } from '../../models/TestConfigurationModel';

import { ScheduledCommandEventSummaryTable } from './scheduled-command/ScheduledCommandEventSummaryTable';
import { FaultEventSummaryTable } from './fault/FaultEventSummaryTable';
import { CommOutageEventSummaryTable } from './comm-outage/CommOutageEventSummaryTable';
import { FaultEventForm } from './fault/FaultEventForm';
import { CommOutageEventForm } from './comm-outage/CommOutageEventForm';
import { ScheduledCommandEventForm } from './scheduled-command/ScheduledCommandEventForm';

import './TestConfigurationTab.light.scss';
import './TestConfigurationTab.dark.scss';

const enum EventType {
  COMM_OUTAGE,
  FAULT,
  SCHEDULED_COMMAND
}

interface Props {
  parentFormGroupModel: FormGroupModel<TestConfigurationModel>;
  modelDictionary: ModelDictionary;
  uploadedTestConfigs: SimulationConfiguration['test_config'];
  simulationStartDateTime: number;
  simulationStopDateTime: number;
  modelDictionaryComponents: ModelDictionaryComponent[];
}

interface State {
  selectedEventTypeToEdit: EventType;
  selectedEventTypeToView: EventType;
  commOutageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  scheduledCommandEvents: ScheduledCommandEvent[];
}

export class TestConfigurationTab extends Component<Props, State> {

  readonly currentEventTagFormControlModel: FormControlModel<string>;
  readonly selectedEventTypeToEditFormControlModel: FormControlModel<EventType>;
  readonly selectedEventTypeToViewFormControlModel: FormControlModel<EventType>;
  readonly dateTimeService = DateTimeService.getInstance();

  private readonly _filePicker = FilePickerService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      selectedEventTypeToEdit: null,
      selectedEventTypeToView: null,
      commOutageEvents: [],
      faultEvents: [],
      scheduledCommandEvents: []
    };

    this.currentEventTagFormControlModel = new FormControlModel(
      generateUniqueId(),
      [
        Validators.checkNotEmpty('Current event tag'),
        this._uniqueEventTagValidator()
      ]
    );
    this.selectedEventTypeToEditFormControlModel = new FormControlModel<EventType>(null);
    this.selectedEventTypeToViewFormControlModel = new FormControlModel<EventType>(null);

    this.addCommonOutageEvent = this.addCommonOutageEvent.bind(this);
    this.addFaultEvent = this.addFaultEvent.bind(this);
    this.addScheduledCommandEvent = this.addScheduledCommandEvent.bind(this);
    this.deleteOutageEvent = this.deleteOutageEvent.bind(this);
    this.deleteFaultEvent = this.deleteFaultEvent.bind(this);
    this.deleteScheduledCommandEvent = this.deleteScheduledCommandEvent.bind(this);
    this.showEventFilePicker = this.showEventFilePicker.bind(this);
    this.saveEventsIntoFile = this.saveEventsIntoFile.bind(this);
  }

  private _prefillForm() {
    if (this.props.uploadedTestConfigs && this.props.uploadedTestConfigs.events.length > 0) {
      // Scheduled Command Events
      const scheduledCommandEvents = this.props.uploadedTestConfigs.events.filter((e) => e.event_type === 'ScheduledCommandEvent');
      const mRIDNameMap = new Map<string, string>();
      for (const measurement of this.props.modelDictionary.measurements) {
        mRIDNameMap.set(measurement['ConductingEquipment_mRID'], measurement['ConductingEquipment_name']);
      }

      // Fault Events
      const faultEvents = this.props.uploadedTestConfigs.events.filter((e) => e.event_type === 'Fault');
      const mRIDTypeMap = new Map<string, string>();
      for (const key of Object.keys(this.props.modelDictionary)) {
        if (typeof this.props.modelDictionary[key] === 'object' && key !== 'measurements') {
          for (const component of this.props.modelDictionary[key]) {
              if ('mRID' in component) {
                if (component['mRID'].constructor === Array) {
                  for (const mrid of component['mRID']) {
                    mRIDTypeMap.set(mrid, this._prettyString(key));
                    if (component['bankName']) {
                      mRIDNameMap.set(mrid, component['bankName']);
                    } else {
                      mRIDNameMap.set(mrid, component['name']);
                    }
                  }
                } else {
                  mRIDTypeMap.set(component['mRID'], this._prettyString(key));
                  if (component['bankName']) {
                    mRIDNameMap.set(component['mRID'], component['bankName']);
                  } else {
                    mRIDNameMap.set(component['mRID'], component['name']);
                  }
                }
              }
          }
        } else if (typeof this.props.modelDictionary[key] === 'object' && key === 'measurements') {
          for (const measurement of this.props.modelDictionary[key]) {
            if (!mRIDTypeMap.get(measurement['ConductingEquipment_mRID'])) {
              mRIDTypeMap.set(measurement['ConductingEquipment_mRID'], measurement['ConductingEquipment_type']);
            }
          }
        }
      }

      // CommOutage Events
      const uploadedCommOutageEvents = this.props.uploadedTestConfigs.events.filter((e) => e.event_type === 'CommOutage');
      const reformattedCommOutageEvents = this._reformatCommOutageEvents(uploadedCommOutageEvents, mRIDTypeMap, mRIDNameMap, this.props.modelDictionaryComponents);
      const reformattedFaultEvents = this._reformatFaultEvents(faultEvents, mRIDTypeMap, mRIDNameMap);
      const reformattedScheduledCommandEvents = this._reformatScheduledCommandEvents(scheduledCommandEvents, mRIDNameMap);
      this.props.parentFormGroupModel.findControl('commOutageEvents').setValue(reformattedCommOutageEvents);
      this.props.parentFormGroupModel.findControl('faultEvents').setValue(reformattedFaultEvents);
      this.props.parentFormGroupModel.findControl('scheduledCommandEvents').setValue(reformattedScheduledCommandEvents);
      this.setState({
        faultEvents: this.state.faultEvents.concat(reformattedFaultEvents),
        commOutageEvents: this.state.commOutageEvents.concat(reformattedCommOutageEvents),
        scheduledCommandEvents:  this.state.scheduledCommandEvents.concat(reformattedScheduledCommandEvents),
        selectedEventTypeToView: reformattedCommOutageEvents.length > 0
                                  ? EventType.COMM_OUTAGE
                                  : reformattedFaultEvents.length > 0
                                  ? EventType.FAULT
                                  : reformattedScheduledCommandEvents.length > 0
                                  ? EventType.SCHEDULED_COMMAND
                                  : null
      });
    }
  }

  private _prettyString(str: string) {
    let result = '';
    switch(str) {
      case 'switches':
        result = str.charAt(0).toUpperCase() + str.slice(1).slice(0, -2);
        break;
      case 'batteries':
        result = str.charAt(0).toUpperCase() + str.slice(1).slice(0, -3) + 'y';
        break;
      default:
        result = str.charAt(0).toUpperCase() + str.slice(1).slice(0, -1);
        break;
    }
    return result;
  }

  // Phases don't matter for CommOutageEvents, attaching all phases from the model dictionary to each CommOutageEvent
  private _reformatCommOutageEvents(uploadedCommOutageEvents: any, mRIDTypeMap: Map<string, string>, mRIDNameMap: Map<string, string>, modelDictionaryComponents: ModelDictionaryComponent[]) {
    const reformatCommOutageEvents: CommOutageEvent[] = [];

    for(const commOutageEvent of uploadedCommOutageEvents) {
      const commOutageEventTemplate: CommOutageEvent = {
        // eslint-disable-next-line camelcase
        event_type: 'CommOutage',
        tag: '',
        allInputOutage: null,
        inputList: [],
        allOutputOutage: null,
        outputList: [],
        // Epoch time with second precision
        startDateTime: null,
        stopDateTime: null
      };
      commOutageEventTemplate.tag = generateUniqueId();
      commOutageEventTemplate.allInputOutage = commOutageEvent['allInputOutage'];
      commOutageEventTemplate.allOutputOutage = commOutageEvent['allOutputOutage'];

      const inputList = commOutageEvent['inputOutageList'];
      const outputList = commOutageEvent['outputOutageList'];
      commOutageEventTemplate.inputList = this._reformatInputList(inputList, mRIDTypeMap, mRIDNameMap, modelDictionaryComponents);
      commOutageEventTemplate.outputList = this._reformatOutputList(outputList, mRIDTypeMap, mRIDNameMap, modelDictionaryComponents);

      commOutageEventTemplate.startDateTime = commOutageEvent['occuredDateTime'];
      commOutageEventTemplate.stopDateTime = commOutageEvent['stopDateTime'];
      reformatCommOutageEvents.push(commOutageEventTemplate);
    }
    return reformatCommOutageEvents;
  }

  private _reformatFaultEvents(faultEvents: any, mRIDTypeMap: Map<string, string>, mRIDNameMap: Map<string, string>) {
    const reformatFaultEvents: FaultEvent[] = [];

    for (const faultEvent of faultEvents) {
      const faultEventTemplate: FaultEvent = {
        // eslint-disable-next-line camelcase
        event_type: 'Fault',
        tag: '',
        equipmentType: '',
        equipmentName: '',
        phases: [],
        faultKind: null,
        faultImpedance: null,
        mRID: '',
        startDateTime: null,
        stopDateTime: null
      };
      faultEventTemplate.tag = generateUniqueId();
      const mRID = faultEvent['ObjectMRID'];
      faultEventTemplate.mRID = mRID;
      faultEventTemplate.equipmentType = mRIDTypeMap.get(mRID[0]);
      faultEventTemplate.equipmentName = mRIDNameMap.get(mRID[0]);
      if (faultEvent['phases'].charAt(0) === 's') {
        faultEventTemplate.phases = [
          {
            phaseLabel: faultEvent['phases'],
            phaseIndex: 0
          }
        ];
      } else {
        faultEventTemplate.phases = faultEvent['phases'].split('').map((p: string, i: number) => {
          return {
            phaseLabel: p,
            phaseIndex: i
          };
        });
      }
      faultEventTemplate.faultKind = faultEvent['PhaseConnectedFaultKind'];
      faultEventTemplate.faultImpedance = faultEvent['FaultImpedance'];
      faultEventTemplate.startDateTime = faultEvent['occuredDateTime'];
      faultEventTemplate.stopDateTime = faultEvent['stopDateTime'];
      reformatFaultEvents.push(faultEventTemplate);
    }
    return reformatFaultEvents;
  }

  private _reformatScheduledCommandEvents(scheduledCommandEvents: any, mRIDNameMap: Map<string, string>) {
    const reformatScheduledCommandEvents: ScheduledCommandEvent[] = [];
    for (const scheduledEvent of scheduledCommandEvents) {
      const scheduledCommandEventTemplate: ScheduledCommandEvent = {
        tag: '',
        eventType: 'ScheduledCommandEvent',
        componentName: '',
        mRID: '',
        attribute: '',
        forwardDifferenceValue: 0,
        reverseDifferenceValue: 0,
        startDateTime: 0,
        stopDateTime: 0
      };

      scheduledCommandEventTemplate.tag = generateUniqueId();
      const forwardObject = scheduledEvent['message']['forward_differences'][0]['object'];
      const forwardAttribute = scheduledEvent['message']['forward_differences'][0]['attribute'];

      if (forwardObject) {
        scheduledCommandEventTemplate.componentName = mRIDNameMap.get(forwardObject);
        scheduledCommandEventTemplate.mRID = forwardObject;
      }
      if (forwardAttribute) {
        scheduledCommandEventTemplate.attribute = forwardAttribute;
      }

      scheduledCommandEventTemplate.forwardDifferenceValue = scheduledEvent['message']['forward_differences'][0]['value'];
      scheduledCommandEventTemplate.reverseDifferenceValue = scheduledEvent['message']['reverse_differences'][0]['value'];
      scheduledCommandEventTemplate.startDateTime = scheduledEvent['occuredDateTime'];
      scheduledCommandEventTemplate.stopDateTime = scheduledEvent['stopDateTime'];
      reformatScheduledCommandEvents.push(scheduledCommandEventTemplate);
    }
    return reformatScheduledCommandEvents;
  }

  private _reformatInputList(inputList: Array<{ objectMRID: string; attribute: string }>, mRIDTypeMap: Map<string, string>, mRIDNameMap: Map<string, string>, modelDictionaryComponents: ModelDictionaryComponent[]) {
    const reformatInputList: CommOutageEventInputListItem[] = [];
    for (const input of inputList) {
      const inputItemTemplate: CommOutageEventInputListItem = {
        type: '',
        name: '',
        phases: [],
        mRID: '',
        attribute: ''
      };

      inputItemTemplate.type = mRIDTypeMap.get(input['objectMRID']);
      inputItemTemplate.name = mRIDNameMap.get(input['objectMRID']);

      if (modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(input.objectMRID)).length > 0) {
        const phases = modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(input.objectMRID))[0]['phases'];
        inputItemTemplate.phases = phases.map((p, i) => {
          return (
            {
              phaseLabel: p,
              phaseIndex: i
            }
          );
        });

      }

      inputItemTemplate.mRID = input.objectMRID;
      inputItemTemplate.attribute = input.attribute;

      reformatInputList.push(inputItemTemplate);
    }

    return reformatInputList;
  }

  private _reformatOutputList(outputList: string[], mRIDTypeMap: Map<string, string>, mRIDNameMap: Map<string, string>, modelDictionaryComponents: ModelDictionaryComponent[]) {
    const reformatOutputList: CommOutageEventOutputListItem[] = [];
    for (const outputMRID of outputList) {
      const outputItemTemplate: CommOutageEventOutputListItem = {
        type: '',
        name: '',
        mRID: '',
        phases: [],
        measurementTypes: []
      };

      outputItemTemplate.type = mRIDTypeMap.get(outputMRID);
      outputItemTemplate.name = mRIDNameMap.get(outputMRID);
      outputItemTemplate.mRID = outputMRID;
      outputItemTemplate.phases = modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(outputMRID)).length > 0
       ? modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(outputMRID))[0]['phases']
        : [];
      const measurementTypes = modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(outputMRID)).length > 0
       ? modelDictionaryComponents.filter((e) => e.conductingEquipmentMRIDs.includes(outputMRID))[0]['type']
       : '';
      outputItemTemplate.measurementTypes = [measurementTypes];
      reformatOutputList.push(outputItemTemplate);
    }
    return reformatOutputList;
  }

  private _uniqueEventTagValidator(): Validator {
    return (control: FormControlModel<string>) => {
      const enteredEventTag = control.getValue();
      if (
        this.state.commOutageEvents.find(e => e.tag === enteredEventTag) !== undefined
        ||
        this.state.faultEvents.find(e => e.tag === enteredEventTag) !== undefined
      ) {
        return {
          isValid: false,
          errorMessage: 'Event ID entered already exists'
        };
      }
      return {
        isValid: true,
        errorMessage: ''
      };
    };
  }

  componentDidMount() {
    this.selectedEventTypeToEditFormControlModel.valueChanges()
      .subscribe({
        next: selectedType => {
          this.setState({
            selectedEventTypeToEdit: selectedType,
            selectedEventTypeToView: selectedType
          });
        }
      });

    this.selectedEventTypeToViewFormControlModel.valueChanges()
      .subscribe({
        next: selectedType => {
          this.setState({
            selectedEventTypeToView: selectedType
          });
        }
      });

    this._prefillForm();
  }

  componentWillUnmount() {
    this.currentEventTagFormControlModel.cleanup();
    this.selectedEventTypeToEditFormControlModel.cleanup();
    this.selectedEventTypeToViewFormControlModel.cleanup();
  }

  render() {
    return (
      <div className='test-configuration-tab'>
        <FormGroup
          className='test-configuration-tab__form'
          collapsible={false}>
          <Input
            label='Event Tag'
            formControlModel={this.currentEventTagFormControlModel} />
          <RadioButtonGroup
            id='event-type'
            label='Event Type'
            formControlModel={this.selectedEventTypeToEditFormControlModel}>
            <RadioButton
              label='CommOutage'
              value={EventType.COMM_OUTAGE} />
            <RadioButton
              label='Fault'
              value={EventType.FAULT} />
            <RadioButton
              label='ScheduledCommand'
              value={EventType.SCHEDULED_COMMAND} />
          </RadioButtonGroup>
          <Tooltip
            content='Upload event file'
            position='right'>
            <IconButton
              icon='cloud_upload'
              style='accent'
              className='test-configuration-tab__form__upload-file'
              onClick={this.showEventFilePicker} />
          </Tooltip>
          <FilePicker />
          {this.showFormForSelectedEventType()}
        </FormGroup>
        {
          (this.state.faultEvents.length > 0 || this.state.commOutageEvents.length > 0 || this.state.scheduledCommandEvents.length > 0)
          &&
          <div className='test-configuration-tab__event-summary'>
            <RadioButtonGroup
              id='event-summary'
              label='Event Summary'
              style='switches'
              formControlModel={this.selectedEventTypeToViewFormControlModel}>
              <RadioButton
                label='CommOutage'
                value={EventType.COMM_OUTAGE}
                selected={this.state.selectedEventTypeToView === EventType.COMM_OUTAGE} />
              <RadioButton
                label='Fault'
                value={EventType.FAULT}
                selected={this.state.selectedEventTypeToView === EventType.FAULT} />
              <RadioButton
                label='Command'
                value={EventType.SCHEDULED_COMMAND}
                selected={this.state.selectedEventTypeToView === EventType.SCHEDULED_COMMAND} />
            </RadioButtonGroup>
            {this.showEventSummaryTable()}
          </div>
        }
        {this.showSaveEventsButton()}
      </div>
    );
  }

  showEventFilePicker() {
    this._filePicker.open()
      .readFileAsJson<{ commOutageEvents: CommOutageEvent[]; faultEvents: FaultEvent[]; scheduledCommandEvents: ScheduledCommandEvent[] }>()
      /* File content should look like this
        {
          "commOutageEvents": [...],
          "faultEvents": [...],
          "scheduledCommandEvents": [...]
        }
      */
      .pipe(filter(content => Boolean(content)))
      .subscribe({
        next: content => {
          const faultEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.faultEvents.concat(content.faultEvents || [])
          ) as FaultEvent[];

          const commOutageEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.commOutageEvents.concat(content.commOutageEvents || [])
          ) as CommOutageEvent[];

          const scheduledCommandEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.scheduledCommandEvents.concat(content.scheduledCommandEvents || [])
          ) as ScheduledCommandEvent[];

          this.props.parentFormGroupModel.findControl('commOutageEvents').setValue(commOutageEvents);
          this.props.parentFormGroupModel.findControl('faultEvents').setValue(faultEvents);
          this.props.parentFormGroupModel.findControl('scheduledCommandEvents').setValue(scheduledCommandEvents);

          this.setState({
            faultEvents,
            commOutageEvents,
            scheduledCommandEvents
          });
        }
      });
  }

  private _parseDateTimeStringsToEpochTimesWithSecondPrecision(events: Array<FaultEvent | CommOutageEvent | ScheduledCommandEvent>) {
    for (const event of events) {
      if (typeof event.startDateTime === 'string') {
        event.startDateTime = this.dateTimeService.parse(event.startDateTime);
      }
      if (typeof event.stopDateTime === 'string') {
        event.stopDateTime = this.dateTimeService.parse(event.stopDateTime);
      }
    }
    return events;
  }

  showFormForSelectedEventType() {
    switch (this.state.selectedEventTypeToEdit) {
      case EventType.COMM_OUTAGE:
        return (
          <CommOutageEventForm
            modelDictionary={this.props.modelDictionary}
            startDateTime={this.props.simulationStartDateTime}
            stopDateTime={this.props.simulationStopDateTime}
            onAddEvent={this.addCommonOutageEvent} />
        );
      case EventType.FAULT:
        return (
          <FaultEventForm
            modelDictionary={this.props.modelDictionary}
            startDateTime={this.props.simulationStartDateTime}
            stopDateTime={this.props.simulationStopDateTime}
            modelDictionaryComponents={this.props.modelDictionaryComponents}
            onAddEvent={this.addFaultEvent} />
        );
      case EventType.SCHEDULED_COMMAND:
        return (
          <ScheduledCommandEventForm
            modelDictionary={this.props.modelDictionary}
            startDateTime={this.props.simulationStartDateTime}
            stopDateTime={this.props.simulationStopDateTime}
            modelDictionaryComponents={this.props.modelDictionaryComponents}
            onAddEvent={this.addScheduledCommandEvent} />
        );
      default:
        return null;
    }
  }

  addCommonOutageEvent(commOutageEvent: CommOutageEvent) {
    commOutageEvent.tag = this.currentEventTagFormControlModel.getValue();
    const commOutageEvents = [...this.state.commOutageEvents, commOutageEvent];
    this.selectedEventTypeToViewFormControlModel.setValue(EventType.COMM_OUTAGE);
    this.currentEventTagFormControlModel.setValue(generateUniqueId());
    this.setState({
      commOutageEvents
    });
    this.props.parentFormGroupModel.findControl('commOutageEvents').setValue(commOutageEvents);
  }

  addFaultEvent(faultEvent: FaultEvent) {
    faultEvent.tag = this.currentEventTagFormControlModel.getValue();
    const faultEvents = [...this.state.faultEvents, faultEvent];
    this.selectedEventTypeToViewFormControlModel.setValue(EventType.FAULT);
    this.currentEventTagFormControlModel.setValue(generateUniqueId());
    this.setState({
      faultEvents
    });
    this.props.parentFormGroupModel.findControl('faultEvents').setValue(faultEvents);
  }

  addScheduledCommandEvent(scheduledCommandEvent: ScheduledCommandEvent) {
    scheduledCommandEvent.tag = this.currentEventTagFormControlModel.getValue();
    const scheduledCommandEvents = [...this.state.scheduledCommandEvents, scheduledCommandEvent];
    this.selectedEventTypeToViewFormControlModel.setValue(EventType.SCHEDULED_COMMAND);
    this.currentEventTagFormControlModel.setValue(generateUniqueId());
    this.setState({
      scheduledCommandEvents
    });
    this.props.parentFormGroupModel.findControl('scheduledCommandEvents').setValue(scheduledCommandEvents);
  }

  showEventSummaryTable() {
    switch (this.state.selectedEventTypeToView) {
      case EventType.COMM_OUTAGE:
        return (
          <CommOutageEventSummaryTable
            events={this.state.commOutageEvents}
            onDeleteEvent={this.deleteOutageEvent} />
        );
      case EventType.FAULT:
        return (
          <FaultEventSummaryTable
            events={this.state.faultEvents}
            onDeleteEvent={this.deleteFaultEvent} />
        );
      case EventType.SCHEDULED_COMMAND:
        return (
          <ScheduledCommandEventSummaryTable
            events={this.state.scheduledCommandEvents}
            onDeleteEvent={this.deleteScheduledCommandEvent} />
        );
      default:
        return null;
    }
  }

  deleteOutageEvent(index: number) {
    const formArrayModel = this.props.parentFormGroupModel.findControl<'commOutageEvents', FormArrayModel<CommOutageEvent>>('commOutageEvents');
    formArrayModel.removeControl(index);
    this.setState({
      commOutageEvents: [...formArrayModel.getValue()]
    });
  }

  deleteFaultEvent(index: number) {
    const formArrayModel = this.props.parentFormGroupModel.findControl<'faultEvents', FormArrayModel<FaultEvent>>('faultEvents');
    formArrayModel.removeControl(index);
    this.setState({
      faultEvents: [...formArrayModel.getValue()]
    });
  }

  deleteScheduledCommandEvent(index: number) {
    const formArrayModel = this.props.parentFormGroupModel.findControl<'scheduledCommandEvents', FormArrayModel<ScheduledCommandEvent>>('scheduledCommandEvents');
    formArrayModel.removeControl(index);
    this.setState({
      scheduledCommandEvents: [...formArrayModel.getValue()]
    });
  }

  showSaveEventsButton() {
    if (this.state.faultEvents.length > 0 || this.state.commOutageEvents.length > 0 || this.state.scheduledCommandEvents.length > 0) {
      return (
        <Tooltip
          content='Save created events'
          position='top'>
          <IconButton
            size='large'
            icon='save'
            className='test-configuration-tab__save-events'
            onClick={this.saveEventsIntoFile} />
        </Tooltip>
      );
    }
    return null;
  }

  saveEventsIntoFile() {
    download(
      'events',
      JSON.stringify({
        commOutageEvents: this._convertEpochTimesToDateTimeStrings(this.state.commOutageEvents),
        faultEvents: this._convertEpochTimesToDateTimeStrings(this.state.faultEvents),
        scheduledCommandEvents: this._convertEpochTimesToDateTimeStrings(this.state.scheduledCommandEvents)
      }, null, 4),
      DownloadType.JSON
    );
  }

  private _convertEpochTimesToDateTimeStrings(events: Array<FaultEvent | CommOutageEvent | ScheduledCommandEvent>) {
    const resultedEvents = [];
    for (const event of events) {
      const clonedEvent = { ...event } as FaultEvent | CommOutageEvent | ScheduledCommandEvent;
      clonedEvent.stopDateTime = this.dateTimeService.format(event.stopDateTime);
      if ('startDateTime' in event) {
        clonedEvent.startDateTime = this.dateTimeService.format(event.startDateTime);
      }
      resultedEvents.push(clonedEvent);
    }
    return resultedEvents;
  }

}
