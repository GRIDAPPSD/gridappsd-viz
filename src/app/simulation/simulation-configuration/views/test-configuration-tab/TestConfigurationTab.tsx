import * as React from 'react';
import { filter } from 'rxjs/operators';

import { FormGroup, Input } from '@shared/form';
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
import { Validators } from '@shared/form/validation';
import { download, DownloadType, generateUniqueId } from '@shared/misc';
import { CommandEventSummaryTable } from './command/CommandEventSummaryTable';
import { DateTimeService } from '@shared/DateTimeService';

import './TestConfigurationTab.light.scss';
import './TestConfigurationTab.dark.scss';

interface Props {
  modelDictionary: ModelDictionary;
  simulationStartTime: number;
  simulationStopTime: number;
  onEventsAdded: (payload: { outageEvents: CommOutageEvent[]; faultEvents: FaultEvent[]; commandEvents: CommandEvent[]; }) => void;
  componentWithConsolidatedPhases: ModelDictionaryComponent[];
}

interface State {
  selectedEventType: 'outage' | 'fault' | 'command';
  selectedEventTypeToView: 'outage' | 'fault' | 'command';
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: CommandEvent[];
  currentOutageEvent: CommOutageEvent;
  currentFaultEvent: FaultEvent;
}

export class TestConfigurationTab extends React.Component<Props, State> {

  tagForCurrentEvent = '';

  private readonly _filePicker = FilePickerService.getInstance();
  private readonly _dateTimeService = DateTimeService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedEventType: null,
      selectedEventTypeToView: null,
      outageEvents: [],
      faultEvents: [],
      commandEvents: [],
      currentFaultEvent: this.defaultFaultEventFormValue(),
      currentOutageEvent: this.defaultOutageEventFormValue()
    };
    this.uniqueEventIdValidator = this.uniqueEventIdValidator.bind(this);
    this.addOutageEvent = this.addOutageEvent.bind(this);
    this.addFaultEvent = this.addFaultEvent.bind(this);
    this.deleteOutageEvent = this.deleteOutageEvent.bind(this);
    this.deleteFaultEvent = this.deleteFaultEvent.bind(this);
    this.showEventFilePicker = this.showEventFilePicker.bind(this);
    this.saveEventsIntoFile = this.saveEventsIntoFile.bind(this);
  }

  defaultFaultEventFormValue(): FaultEvent {
    return {
      event_type: 'Fault',
      tag: generateUniqueId(),
      equipmentType: '',
      equipmentName: '',
      phases: [],
      mRID: '',
      faultKind: FaultKind.LINE_TO_GROUND,
      FaultImpedance: {
        rGround: '',
        xGround: '',
        rLinetoLine: '',
        xLineToLine: ''
      },
      startDateTime: this.props.simulationStartTime,
      stopDateTime: this.props.simulationStopTime
    };
  }

  defaultOutageEventFormValue(): CommOutageEvent {
    return {
      event_type: 'CommOutage',
      tag: generateUniqueId(),
      allInputOutage: false,
      inputList: [],
      allOutputOutage: false,
      outputList: [],
      startDateTime: this.props.simulationStartTime,
      stopDateTime: this.props.simulationStopTime
    };
  }

  render() {
    return (
      <div className='test-configuration-tab'>
        <FormGroup
          className='test-configuration-tab__form'
          collapsible={false}>
          <Input
            label='Event Tag'
            name='eventTag'
            value={
              this.state.selectedEventType === 'outage' ? this.state.currentOutageEvent.tag : this.state.currentFaultEvent.tag
            }
            onChange={value => this.tagForCurrentEvent = value}
            validators={[
              Validators.checkNotEmpty('Event tag is empty'),
              this.uniqueEventIdValidator
            ]} />
          <RadioButtonGroup
            id='event-type'
            label='Event Type'>
            <RadioButton
              label='CommOutage'
              onSelect={() => this.setState({ selectedEventType: 'outage', selectedEventTypeToView: 'outage' })} />
            <RadioButton
              label='Fault'
              onSelect={() => this.setState({ selectedEventType: 'fault', selectedEventTypeToView: 'fault' })} />
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
              style='switches'>
              <RadioButton
                label='CommOutage'
                selected={this.state.selectedEventTypeToView === 'outage'}
                onSelect={() => this.setState({ selectedEventTypeToView: 'outage' })} />
              <RadioButton
                label='Fault'
                selected={this.state.selectedEventTypeToView === 'fault'}
                onSelect={() => this.setState({ selectedEventTypeToView: 'fault' })} />
              <RadioButton
                label='Command'
                selected={this.state.selectedEventTypeToView === 'command'}
                onSelect={() => this.setState({ selectedEventTypeToView: 'command' })} />
            </RadioButtonGroup>
            {this.showEventSummaryTable()}
          </div>
        }
        {this.showSaveEventsButton()}
      </div>
    );
  }

  uniqueEventIdValidator(value: string) {
    for (const event of this.state.outageEvents)
      if (event.tag === value)
        return {
          isValid: false,
          errorMessage: 'Event ID entered already exists'
        };
    for (const event of this.state.faultEvents)
      if (event.tag === value)
        return {
          isValid: false,
          errorMessage: 'Event ID entered already exists'
        };
    return {
      isValid: true,
      errorMessage: ''
    };
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

          this.setState({
            faultEvents,
            outageEvents,
            commandEvents
          });
          this.props.onEventsAdded({
            faultEvents,
            outageEvents,
            commandEvents
          });
        }
      });
  }

  private _parseDateTimeStringsToEpochTimesWithSecondPrecision(events: Array<FaultEvent | CommOutageEvent | CommandEvent>) {
    for (const event of events) {
      if (typeof event.stopDateTime === 'string')
        event.stopDateTime = this._dateTimeService.parse(event.stopDateTime);
      if ('startDateTime' in event && typeof event.startDateTime === 'string')
        event.startDateTime = this._dateTimeService.parse(event.startDateTime);
      else if ('occuredDateTime' in event && typeof event.occuredDateTime === 'string')
        event.occuredDateTime = this._dateTimeService.parse(event.occuredDateTime);
    }
    return events;
  }

  showFormForSelectedEventType() {
    switch (this.state.selectedEventType) {
      case 'outage':
        return (
          <CommOutageEventForm
            modelDictionary={this.props.modelDictionary}
            initialFormValue={this.state.currentOutageEvent}
            onEventAdded={this.addOutageEvent} />
        );
      case 'fault':
        return (
          <FaultEventForm
            modelDictionary={this.props.modelDictionary}
            initialFormValue={this.state.currentFaultEvent}
            componentsWithConsolidatedPhases={this.props.componentWithConsolidatedPhases}
            onEventAdded={this.addFaultEvent} />
        );
      default:
        return null;
    }
  }

  addOutageEvent(event: CommOutageEvent) {
    if (this.tagForCurrentEvent !== '') {
      event.tag = this.tagForCurrentEvent;
      this.tagForCurrentEvent = '';
    }
    const events = [...this.state.outageEvents, event];
    this.setState({
      outageEvents: events,
      selectedEventTypeToView: 'outage',
      currentOutageEvent: this.defaultOutageEventFormValue()
    });
    this.props.onEventsAdded({
      outageEvents: events,
      faultEvents: this.state.faultEvents,
      commandEvents: this.state.commandEvents
    });
  }

  addFaultEvent(event: FaultEvent) {
    if (this.tagForCurrentEvent !== '') {
      event.tag = this.tagForCurrentEvent;
      this.tagForCurrentEvent = '';
    }
    const events = [...this.state.faultEvents, event];
    this.setState({
      faultEvents: events,
      selectedEventTypeToView: 'fault',
      currentFaultEvent: this.defaultFaultEventFormValue()
    });
    this.props.onEventsAdded({
      faultEvents: events,
      outageEvents: this.state.outageEvents,
      commandEvents: this.state.commandEvents
    });
  }

  showEventSummaryTable() {
    switch (this.state.selectedEventTypeToView) {
      case 'outage':
        return (
          <CommOutageEventSummaryTable
            events={this.state.outageEvents}
            onDeleteEvent={this.deleteOutageEvent} />
        );
      case 'fault':
        return (
          <FaultEventSummaryTable
            events={this.state.faultEvents}
            onDeleteEvent={this.deleteFaultEvent} />
        );
      case 'command':
        return (
          <CommandEventSummaryTable events={this.state.commandEvents} />
        );
      default:
        return null;
    }
  }

  deleteOutageEvent(event: CommOutageEvent) {
    this.setState({
      outageEvents: this.state.outageEvents.filter(e => e !== event)
    });
  }

  deleteFaultEvent(event: FaultEvent) {
    this.setState({
      faultEvents: this.state.faultEvents.filter(e => e !== event)
    });
  }

  showSaveEventsButton() {
    if (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0)
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
      clonedEvent.stopDateTime = this._dateTimeService.format(event.stopDateTime);
      if ('startDateTime' in event)
        clonedEvent.startDateTime = this._dateTimeService.format(event.startDateTime);
      else if ('occuredDateTime' in event)
        clonedEvent.occuredDateTime = this._dateTimeService.format(event.occuredDateTime);
      resultedEvents.push(clonedEvent);
    }
    return resultedEvents;
  }

}
