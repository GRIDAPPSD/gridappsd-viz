import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CommOutageEvent, FaultEvent, CommandEvent } from '@shared/test-manager';
import { StateStore } from '@shared/state-store';
import { CommOutageEventSummary } from './comm-outage/CommOutageEventSummary';
import { FaultEventSummary } from './fault/FaultEventSummary';
import { CommandEventSummary } from './command/CommandEventSummary';
import { MessageBanner } from '@shared/overlay/message-banner';

import './EventSummary.light.scss';
import './EventSummary.dark.scss';

interface Props {
}

interface State {
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: CommandEvent[];
  faultMRIDs: string[];
}

export class EventSummary extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      outageEvents: [],
      faultEvents: [],
      commandEvents: [],
      faultMRIDs: []
    };
  }

  componentDidMount() {
    this._stateStore.select('outageEvents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: events => this.setState({ outageEvents: events })
      });

    this._stateStore.select('faultEvents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: events => this.setState({ faultEvents: events })
      });

    this._stateStore.select('faultMRIDs')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: faultMRIDs => this.setState({ faultMRIDs })
      });

    this._stateStore.select('commandEvents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: commandEvents => this.setState({ commandEvents })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    if (this.state.outageEvents.length === 0 && this.state.faultEvents.length === 0 && this.state.commandEvents.length === 0) {
      return (
        <MessageBanner>
          No data available
        </MessageBanner>
      );
    }
    return (
      <div className='event-summary'>
        {
          this.state.outageEvents.length > 0
          &&
          <>
            <h1 className='event-summary__table-name'>CommOutage</h1>
            <CommOutageEventSummary
              events={this.state.outageEvents}
              faultMRIDs={this.state.faultMRIDs}
              onInitialize={this.initializeEvent}
              onClear={this.clearEvent} />
          </>
        }
        {
          this.state.faultEvents.length > 0
          &&
          <>
            <h1 className='event-summary__table-name'>Fault</h1>
            <FaultEventSummary
              events={this.state.faultEvents}
              faultMRIDs={this.state.faultMRIDs.slice(this.state.outageEvents.length)}
              onInitialize={this.initializeEvent}
              onClear={this.clearEvent} />
          </>
        }
        {
          this.state.commandEvents.length > 0
          &&
          <>
            <h1 className='event-summary__table-name'>Command</h1>
            <CommandEventSummary events={this.state.commandEvents} />
          </>
        }
      </div>
    );
  }

  initializeEvent(event: CommOutageEvent | FaultEvent) {
    // eslint-disable-next-line no-console
    console.log(event);
  }

  clearEvent(event: CommOutageEvent | FaultEvent) {
    // eslint-disable-next-line no-console
    console.log(event);
  }

}
