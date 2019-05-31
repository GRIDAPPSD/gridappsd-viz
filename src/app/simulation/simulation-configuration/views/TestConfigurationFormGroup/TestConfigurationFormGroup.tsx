import * as React from 'react';
import { filter } from 'rxjs/operators';

import { FormGroup, Input } from '@shared/form';
import { RadioButtonGroup, RadioButton } from '@shared/form/radio';
import { ModelDictionary } from '@shared/topology';
import { OutageEventForm } from './OutageEventForm';
import { FaultEventForm } from './FaultEventForm';
import { FaultEvent, FaultKind } from '../../models/FaultEvent';
import { OutageEvent } from '../../models/OutageEvent';
import { OutageEventSummaryTable } from './OutageEventSummaryTable';
import { IconButton } from '@shared/buttons';
import { FilePicker, FilePickerService } from '@shared/file-picker';
import { Tooltip } from '@shared/tooltip';

import './TestConfigurationFormGroup.scss';
import { FaultEventSummaryTable } from './FaultEventSummaryTable';

interface Props {
  modelDictionary: ModelDictionary;
  simulationStartDate: string;
  simulationStopDate: string;
  onEventsAdded: (events: { outage: OutageEvent[]; fault: FaultEvent[] }) => void;
}

interface State {
  selectedEventType: 'outage' | 'fault';
  selectedEventTypeToView: 'outage' | 'fault';
  outageEvents: OutageEvent[];
  faultEvents: FaultEvent[];
  currentOutageEvent: OutageEvent;
  currentFaultEvent: FaultEvent;
}

export class TestConfigurationFormGroup extends React.Component<Props, State> {

  private readonly _filePicker = FilePickerService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedEventType: null,
      selectedEventTypeToView: null,
      outageEvents: [],
      faultEvents: [],
      currentFaultEvent: this.defaultFaultEventFormValue(),
      currentOutageEvent: this.defaultOutageEventFormValue()
    }
    this.showEventFilePicker = this.showEventFilePicker.bind(this);
    this.saveEventsIntoFile = this.saveEventsIntoFile.bind(this);
  }

  defaultFaultEventFormValue(): FaultEvent {
    return {
      type: 'Fault',
      id: this._generateEventId(),
      equipmentType: '',
      equipmentName: '',
      phase: '',
      faultKind: FaultKind.LINE_TO_GROUND,
      lineToGround: '',
      lineToLine: '',
      lineToLineToGround: '',
      impedance: {
        rGround: '',
        xGround: '',
        rLinetoLine: '',
        xLineToLine: ''
      },
      startDateTime: this.props.simulationStartDate,
      stopDateTime: this.props.simulationStopDate
    }
  }

  defaultOutageEventFormValue(): OutageEvent {
    return {
      type: 'CommOutage',
      id: this._generateEventId(),
      allInputOutage: false,
      inputList: [],
      allOutputOutage: false,
      outputList: [],
      startDateTime: this.props.simulationStartDate,
      stopDateTime: this.props.simulationStopDate
    }
  }

  private _generateEventId() {
    return btoa(String(Math.random())).toLowerCase().substr(0, 8);
  }

  render() {
    return (
      <div className='test-configuration'>
        <FormGroup className='test-configuration__form'>
          <Input
            label='Event ID'
            name='eventId'
            value={this.state.selectedEventType === 'outage' ? this.state.currentOutageEvent.id : this.state.currentFaultEvent.id}
            onChange={value => {
              if (this.state.selectedEventType === 'fault')
                this.state.currentFaultEvent.id = value;
              else
                this.state.currentOutageEvent.id = value;
            }} />
          <RadioButtonGroup id='event-type' label='Event Type'>
            <RadioButton
              label='CommOutage'
              onSelect={() => this.setState({ selectedEventType: 'outage', selectedEventTypeToView: 'outage' })} />
            <RadioButton
              label='Fault'
              onSelect={() => this.setState({ selectedEventType: 'fault', selectedEventTypeToView: 'fault' })} />
          </RadioButtonGroup>
          {this.showUploadEventFileButton()}
          {this.showFormForSelectedEventType()}
        </FormGroup>
        {
          (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0) &&
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
            </RadioButtonGroup>
            {this.showEventSummaryTable()}
          </div>
        }
        {this.showSaveEventsButton()}
      </div>
    );
  }

  showUploadEventFileButton() {
    if (this.state.selectedEventType !== null)
      return (
        <>
          <Tooltip
            content='Upload event file'
            position='right'>
            <IconButton
              icon='cloud_upload'
              style='accent'
              rounded
              className='test-configuration__form__upload-file'
              onClick={this.showEventFilePicker} />
          </Tooltip>
          <FilePicker />
        </>
      );
    return null;
  }

  showEventFilePicker() {
    this._filePicker.open()
      .readFileAsJson<{ outageEvents: OutageEvent[]; faultEvents: FaultEvent[] }>()
      /* File content should look like this
        {
          "outageEvents": [...],
          "faultEvents": [...]
        }
      */
      .pipe(filter(content => Boolean(content)))
      .subscribe({
        next: content => {
          this.setState({
            faultEvents: content.faultEvents || [],
            outageEvents: content.outageEvents || []
          });
        }
      });

  }

  showFormForSelectedEventType() {
    switch (this.state.selectedEventType) {
      case 'outage':
        return (
          <OutageEventForm
            modelDictionary={this.props.modelDictionary}
            initialFormValue={this.state.currentOutageEvent}
            onEventAdded={event => {
              const events = [...this.state.outageEvents, event];
              this.setState({
                outageEvents: events,
                selectedEventTypeToView: 'outage',
                currentOutageEvent: this.defaultOutageEventFormValue()
              });
              this.props.onEventsAdded({
                outage: events,
                fault: this.state.faultEvents
              });
            }} />
        );
      case 'fault':
        return (
          <FaultEventForm
            modelDictionary={this.props.modelDictionary}
            initialFormValue={this.state.currentFaultEvent}
            onEventAdded={event => {
              const events = [...this.state.faultEvents, event];
              this.setState({
                faultEvents: events,
                selectedEventTypeToView: 'fault',
                currentFaultEvent: this.defaultFaultEventFormValue()
              });
              this.props.onEventsAdded({
                fault: events,
                outage: this.state.outageEvents
              });
            }} />
        );
      default:
        return null;
    }
  }

  showEventSummaryTable() {
    switch (this.state.selectedEventTypeToView) {
      case 'outage':
        return (
          <OutageEventSummaryTable
            events={this.state.outageEvents}
            onDeleteEvent={event => {
              this.setState({
                outageEvents: this.state.outageEvents.filter(e => e !== event)
              })
            }} />
        );
      case 'fault':
        return (
          <FaultEventSummaryTable
            events={this.state.faultEvents}
            onDeleteEvent={event => {
              this.setState({
                faultEvents: this.state.faultEvents.filter(e => e !== event)
              })
            }} />
        );
      default:
        return null;
    }
  }

  showSaveEventsButton() {
    if (this.state.faultEvents.length > 0 || this.state.outageEvents.length > 0)
      return (
        <Tooltip
          content='Save created events'
          position='top'>
          <IconButton
            rounded
            size='large'
            icon='save'
            className='test-configuration__save-events'
            onClick={this.saveEventsIntoFile} />
        </Tooltip>
      );
    return null;
  }

  saveEventsIntoFile() {
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none');
    const fileContent = JSON.stringify({
      outageEvents: this.state.outageEvents,
      faultEvents: this.state.faultEvents
    }, null, 4);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    a.href = downloadUrl;
    a.download = 'events.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

}