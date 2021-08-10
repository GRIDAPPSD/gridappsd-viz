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
import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@shared/test-manager';
import { Validators, Validator } from '@shared/form/validation';
import { download, DownloadType, generateUniqueId } from '@shared/misc';
import { ScheduledCommandEventSummaryTable } from './scheduled-command/ScheduledCommandEventSummaryTable';
import { DateTimeService } from '@shared/DateTimeService';
import { TestConfigurationModel } from '../../models/TestConfigurationModel';
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
