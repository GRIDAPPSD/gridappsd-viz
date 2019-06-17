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
  outageEvents: any[];
  faultEvents: any[];
  faultMRIDs: string[];
}

export class EventSummary extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _unmountingNotifier = new Subject<void>();

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
      .pipe(takeUntil(this._unmountingNotifier))
      .subscribe({
        next: events => this.setState({ outageEvents: events })
      });
    this._stateStore.select('faultEvents')
      .pipe(takeUntil(this._unmountingNotifier))
      .subscribe({
        next: events => this.setState({ faultEvents: events })
      });
    this._stateStore.select('startSimulationResponse')
      .pipe(takeUntil(this._unmountingNotifier))
      .subscribe({
        next: state => this.setState({ faultMRIDs: state.events.map(e => e.faultMRID) })
      });
  }

  componentWillUnmount() {
    this._unmountingNotifier.complete();
  }

  render() {
    return (
      <div className='event-summary'>
        {
          this.state.outageEvents.length > 0
          &&
          <CommOutageEventSummary
            events={this.state.outageEvents}
            faultMRIDs={this.state.faultMRIDs}
            onInitialize={this.initializeEvent}
            onClear={this.clearEvent} />
        }
        {
          this.state.faultEvents.length > 0
          &&
          <FaultEventSummary
            events={this.state.faultEvents}
            faultMRIDs={this.state.faultMRIDs.slice(this.state.outageEvents.length)}
            onInitialize={this.initializeEvent}
            onClear={this.clearEvent} />
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
