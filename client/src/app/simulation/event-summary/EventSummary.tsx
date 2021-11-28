import { Component } from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@client:common/test-manager';
import { StateStore } from '@client:common/state-store';
import { MessageBanner } from '@client:common/overlay/message-banner';

import { CommOutageEventSummary } from './comm-outage/CommOutageEventSummary';
import { FaultEventSummary } from './fault/FaultEventSummary';
import { ScheduledCommandEventSummary } from './scheduled-command/ScheduledCommandEventSummary';

import './EventSummary.light.scss';
import './EventSummary.dark.scss';

interface Props {
}

interface State {
  commOutageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  scheduledCommandEvents: ScheduledCommandEvent[];
  faultMRIDs: string[];
}

export class EventSummary extends Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      commOutageEvents: [],
      faultEvents: [],
      scheduledCommandEvents: [],
      faultMRIDs: []
    };
  }

  componentDidMount() {
    this._stateStore.select('commOutageEvents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: events => this.setState({ commOutageEvents: events })
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

    this._stateStore.select('scheduledCommandEvents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: scheduledCommandEvents => this.setState({ scheduledCommandEvents })
      });

    this._stateStore.select('timeZone')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: () => {
          if (this.state.commOutageEvents.length > 0) {
            this.setState({
              commOutageEvents: [...this.state.commOutageEvents]
            });
          }
          if (this.state.faultEvents.length > 0) {
            this.setState({
              faultEvents: [...this.state.faultEvents]
            });
          }
          if (this.state.scheduledCommandEvents.length > 0) {
            this.setState({
              scheduledCommandEvents: [...this.state.scheduledCommandEvents]
            });
          }
        }
      });

  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    if (this.state.commOutageEvents.length === 0 && this.state.faultEvents.length === 0 && this.state.scheduledCommandEvents.length === 0) {
      return (
        <MessageBanner>
          No data available
        </MessageBanner>
      );
    }
    return (
      <div className='event-summary'>
        {
          this.state.commOutageEvents.length > 0
          &&
          <>
            <h1 className='event-summary__table-name'>CommOutage</h1>
            <CommOutageEventSummary
              events={this.state.commOutageEvents}
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
              faultMRIDs={this.state.faultMRIDs.slice(this.state.commOutageEvents.length)}
              onInitialize={this.initializeEvent}
              onClear={this.clearEvent} />
          </>
        }
        {
          this.state.scheduledCommandEvents.length > 0
          &&
          <>
            <h1 className='event-summary__table-name'>ScheduledCommand</h1>
            <ScheduledCommandEventSummary
              events={this.state.scheduledCommandEvents}
              onInitialize={this.initializeEvent}
              onClear={this.clearEvent} />
          </>
        }
      </div>
    );
  }

  initializeEvent(event: CommOutageEvent | FaultEvent | ScheduledCommandEvent) {
    // eslint-disable-next-line no-console
    console.log(event);
  }

  clearEvent(event: CommOutageEvent | FaultEvent | ScheduledCommandEvent) {
    // eslint-disable-next-line no-console
    console.log(event);
  }

}
