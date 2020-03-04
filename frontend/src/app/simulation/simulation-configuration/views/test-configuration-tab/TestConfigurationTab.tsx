import * as React from 'react';
import { filter } from 'rxjs/operators';

import { FormGroup, Input, FormGroupModel, FormControlModel, FormArrayModel } from '@shared/form';
import { RadioButtonGroup, RadioButton } from '@shared/form/radio';
import { ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { CommOutageEventForm } from './comm-outage/CommOutageEventForm';
import { FaultEventForm } from './fault/FaultEventForm';
import { CommOutageEventSummaryTable } from './comm-outage/CommOutageEventSummaryTable';
import { IconButton } from '@shared/buttons';
import { FilePicker, FilePickerService } from '@shared/file-picker';
import { Tooltip } from '@shared/tooltip';
import { FaultEventSummaryTable } from './fault/FaultEventSummaryTable';
import { CommOutageEvent, FaultEvent, FaultKind, CommandEvent } from '@shared/test-manager';
import { Validators, Validator } from '@shared/form/validation';
import { download, DownloadType, generateUniqueId } from '@shared/misc';
import { CommandEventSummaryTable } from './command/CommandEventSummaryTable';
import { DateTimeService } from '@shared/DateTimeService';
import { TestConfigurationModel } from '../../models/TestConfigurationModel';

import './TestConfigurationTab.light.scss';
import './TestConfigurationTab.dark.scss';

const enum EventType {
  OUTAGE,
  FAULT,
  COMMAND
}

interface Props {
  parentFormGroupModel: FormGroupModel<TestConfigurationModel>;
  modelDictionary: ModelDictionary;
  simulationStartDateTime: number;
  simulationStopDateTime: number;
  componentWithConsolidatedPhases: ModelDictionaryComponent[];
}

interface State {
  selectedEventTypeToEdit: EventType;
  selectedEventTypeToView: EventType;
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: CommandEvent[];
}

export class TestConfigurationTab extends React.Component<Props, State> {

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
      outageEvents: [],
      faultEvents: [],
      commandEvents: []
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

    this.addOutageEvent = this.addOutageEvent.bind(this);
    this.addFaultEvent = this.addFaultEvent.bind(this);
    this.deleteOutageEvent = this.deleteOutageEvent.bind(this);
    this.deleteFaultEvent = this.deleteFaultEvent.bind(this);
    this.showEventFilePicker = this.showEventFilePicker.bind(this);
    this.saveEventsIntoFile = this.saveEventsIntoFile.bind(this);
  }

  private _uniqueEventTagValidator(): Validator {
    return (control: FormControlModel<string>) => {
      const enteredEventTag = control.getValue();
      if (
        this.state.outageEvents.find(e => e.tag === enteredEventTag) !== undefined
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
  }

  private _defaultOutageEventFormValue(): CommOutageEvent {
    return {
      eventType: 'CommOutage',
      tag: this.currentEventTagFormControlModel.getValue(),
      allInputOutage: false,
      inputList: [],
      allOutputOutage: false,
      outputList: [],
      startDateTime: this.props.simulationStartDateTime,
      stopDateTime: this.props.simulationStopDateTime
    };
  }

  private _defaultFaultEventFormValue(): FaultEvent {
    return {
      eventType: 'Fault',
      tag: this.currentEventTagFormControlModel.getValue(),
      equipmentType: '',
      equipmentName: '',
      phases: [],
      mRID: '',
      faultKind: FaultKind.LINE_TO_GROUND,
      faultImpedance: {
        rGround: '',
        xGround: '',
        rLineToLine: '',
        xLineToLine: ''
      },
      startDateTime: this.props.simulationStartDateTime,
      stopDateTime: this.props.simulationStopDateTime
    };
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
              value={EventType.OUTAGE} />
            <RadioButton
              label='Fault'
              value={EventType.FAULT} />
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
          (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0 || this.state.commandEvents.length > 0)
          &&
          <div className='test-configuration-tab__event-summary'>
            <RadioButtonGroup
              id='event-summary'
              label='Event Summary'
              style='switches'
              formControlModel={this.selectedEventTypeToViewFormControlModel}>
              <RadioButton
                label='CommOutage'
                value={EventType.OUTAGE}
                selected={this.state.selectedEventTypeToView === EventType.OUTAGE} />
              <RadioButton
                label='Fault'
                value={EventType.FAULT}
                selected={this.state.selectedEventTypeToView === EventType.FAULT} />
              <RadioButton
                label='Command'
                value={EventType.COMMAND}
                selected={this.state.selectedEventTypeToView === EventType.COMMAND} />
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
      .readFileAsJson<{ outageEvents: CommOutageEvent[]; faultEvents: FaultEvent[]; commandEvents: CommandEvent[]; }>()
      /* File content should look like this
        {
          "outageEvents": [...],
          "faultEvents": [...],
          "commandEvents": [...]
        }
      */
      .pipe(filter(content => Boolean(content)))
      .subscribe({
        next: content => {
          const faultEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.faultEvents.concat(content.faultEvents || [])
          ) as FaultEvent[];

          const outageEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.outageEvents.concat(content.outageEvents || [])
          ) as CommOutageEvent[];

          const commandEvents = this._parseDateTimeStringsToEpochTimesWithSecondPrecision(
            this.state.commandEvents.concat(content.commandEvents || [])
          ) as CommandEvent[];

          this.props.parentFormGroupModel.findControl('outageEvents').setValue(outageEvents);
          this.props.parentFormGroupModel.findControl('faultEvents').setValue(faultEvents);
          this.props.parentFormGroupModel.findControl('commandEvents').setValue(commandEvents);

          this.setState({
            faultEvents,
            outageEvents,
            commandEvents
          });
        }
      });
  }

  private _parseDateTimeStringsToEpochTimesWithSecondPrecision(events: Array<FaultEvent | CommOutageEvent | CommandEvent>) {
    for (const event of events) {
      if (typeof event.stopDateTime === 'string') {
        event.stopDateTime = this.dateTimeService.parse(event.stopDateTime);
      }
      if ('startDateTime' in event && typeof event.startDateTime === 'string') {
        event.startDateTime = this.dateTimeService.parse(event.startDateTime);
      } else if ('occuredDateTime' in event && typeof event.occuredDateTime === 'string') {
        event.occuredDateTime = this.dateTimeService.parse(event.occuredDateTime);
      }
    }
    return events;
  }

  showFormForSelectedEventType() {
    switch (this.state.selectedEventTypeToEdit) {
      case EventType.OUTAGE:
        return (
          <CommOutageEventForm
            modelDictionary={this.props.modelDictionary}
            startDateTime={this.props.simulationStartDateTime}
            stopDateTime={this.props.simulationStopDateTime}
            onAddEvent={this.addOutageEvent} />
        );
      case EventType.FAULT:
        return (
          <FaultEventForm
            modelDictionary={this.props.modelDictionary}
            startDateTime={this.props.simulationStartDateTime}
            stopDateTime={this.props.simulationStopDateTime}
            componentsWithConsolidatedPhases={this.props.componentWithConsolidatedPhases}
            onAddEvent={this.addFaultEvent} />
        );
      default:
        return null;
    }
  }

  addOutageEvent(commOutageEvent: CommOutageEvent) {
    commOutageEvent.tag = this.currentEventTagFormControlModel.getValue();
    const outageEvents = [...this.state.outageEvents, commOutageEvent];
    this.selectedEventTypeToViewFormControlModel.setValue(EventType.OUTAGE);
    this.currentEventTagFormControlModel.setValue(generateUniqueId());
    this.setState({
      outageEvents
    });
    this.props.parentFormGroupModel.findControl('outageEvents').setValue(outageEvents);
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

  showEventSummaryTable() {
    switch (this.state.selectedEventTypeToView) {
      case EventType.OUTAGE:
        return (
          <CommOutageEventSummaryTable
            events={this.state.outageEvents}
            onDeleteEvent={this.deleteOutageEvent} />
        );
      case EventType.FAULT:
        return (
          <FaultEventSummaryTable
            events={this.state.faultEvents}
            onDeleteEvent={this.deleteFaultEvent} />
        );
      case EventType.COMMAND:
        return (
          <CommandEventSummaryTable events={this.state.commandEvents} />
        );
      default:
        return null;
    }
  }

  deleteOutageEvent(index: number) {
    const formArrayModel = this.props.parentFormGroupModel.findControl<'outageEvents', FormArrayModel<CommOutageEvent>>('outageEvents');
    formArrayModel.removeControl(index);
    this.setState({
      outageEvents: [...formArrayModel.getValue()]
    });
  }

  deleteFaultEvent(index: number) {
    const formArrayModel = this.props.parentFormGroupModel.findControl<'faultEvents', FormArrayModel<FaultEvent>>('faultEvents');
    formArrayModel.removeControl(index);
    this.setState({
      faultEvents: [...formArrayModel.getValue()]
    });
  }

  showSaveEventsButton() {
    if (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0) {
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
      'events.json',
      JSON.stringify({
        outageEvents: this._convertEpochTimesToDateTimeStrings(this.state.outageEvents),
        faultEvents: this._convertEpochTimesToDateTimeStrings(this.state.faultEvents),
        commandEvents: this._convertEpochTimesToDateTimeStrings(this.state.commandEvents)
      }, null, 4),
      DownloadType.JSON
    );
  }

  private _convertEpochTimesToDateTimeStrings(events: Array<FaultEvent | CommOutageEvent | CommandEvent>) {
    const resultedEvents = [];
    for (const event of events) {
      const clonedEvent = { ...event } as any;
      clonedEvent.stopDateTime = this.dateTimeService.format(event.stopDateTime);
      if ('startDateTime' in event) {
        clonedEvent.startDateTime = this.dateTimeService.format(event.startDateTime);
      } else if ('occuredDateTime' in event) {
        clonedEvent.occuredDateTime = this.dateTimeService.format(event.occuredDateTime);
      }
      resultedEvents.push(clonedEvent);
    }
    return resultedEvents;
  }

}
