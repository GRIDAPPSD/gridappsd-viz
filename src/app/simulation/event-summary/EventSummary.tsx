import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CommOutageEvent, FaultEvent } from '@shared/test-manager';
import { StateStore } from '@shared/state-store';
import { CommOutageEventSummary } from './CommOutageEventSummary';
import { FaultEventSummary } from './FaultEventSummary';

import './EventSummary.scss';

interface Props {
}

interface State {
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
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
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
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
      </div>
    );
  }


  initializeEvent(event: CommOutageEvent | FaultEvent) {
    console.log(event);
  }

  clearEvent(event: CommOutageEvent | FaultEvent) {
    console.log(event);
  }

}
