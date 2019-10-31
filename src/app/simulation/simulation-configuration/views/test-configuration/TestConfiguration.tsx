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
import { download, DownloadType } from '@shared/misc';
import { CommandEventSummaryTable } from './command/CommandEventSummaryTable';

import './TestConfiguration.light.scss';
import './TestConfiguration.dark.scss';

interface Props {
  modelDictionary: ModelDictionary;
  simulationStartDate: string;
  simulationStopDate: string;
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

export class TestConfiguration extends React.Component<Props, State> {

  private readonly _filePicker = FilePickerService.getInstance();
  private _tagForCurrentEvent = '';

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
      tag: this._generateEventTag(),
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
      startDateTime: this.props.simulationStartDate,
      stopDateTime: this.props.simulationStopDate
    };
  }

  defaultOutageEventFormValue(): CommOutageEvent {
    return {
      event_type: 'CommOutage',
      tag: this._generateEventTag(),
      allInputOutage: false,
      inputList: [],
      allOutputOutage: false,
      outputList: [],
      startDateTime: this.props.simulationStartDate,
      stopDateTime: this.props.simulationStopDate
    };
  }

  private _generateEventTag() {
    this._tagForCurrentEvent = btoa(String(Math.random())).toLowerCase().substr(0, 8);
    return this._tagForCurrentEvent;
  }

  render() {
    return (
      <div className='test-configuration'>
        <FormGroup
          className='test-configuration__form'
          collapsible={false}>
          <Input
            label='Event Tag'
            name='eventTag'
            value={
              this.state.selectedEventType === 'outage' ? this.state.currentOutageEvent.tag : this.state.currentFaultEvent.tag
            }
            onChange={value => this._tagForCurrentEvent = value}
            validators={[
              Validators.checkNotEmpty('Event tag is empty'),
              this.uniqueEventIdValidator
            ]} />
          <RadioButtonGroup id='event-type' label='Event Type'>
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
              className='test-configuration__form__upload-file'
              onClick={this.showEventFilePicker} />
          </Tooltip>
          <FilePicker />
          {this.showFormForSelectedEventType()}
        </FormGroup>
        {
          (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0 || this.state.commandEvents.length > 0)
          &&
          <div className='test-configuration__event-summary'>
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
          const faultEvents = this.state.faultEvents.concat(content.faultEvents || []);
          const outageEvents = this.state.outageEvents.concat(content.outageEvents || []);
          const commandEvents = this.state.commandEvents.concat(content.commandEvents || []);
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
    event.tag = this._tagForCurrentEvent;
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
    event.tag = this._tagForCurrentEvent;
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
            className='test-configuration__save-events'
            onClick={this.saveEventsIntoFile} />
        </Tooltip>
      );
    return null;
  }

  saveEventsIntoFile() {
    download(
      'events.json',
      JSON.stringify({
        outageEvents: this.state.outageEvents,
        faultEvents: this.state.faultEvents,
        commandEvents: this.state.commandEvents
      }, null, 4),
      DownloadType.JSON
    );
  }

}
