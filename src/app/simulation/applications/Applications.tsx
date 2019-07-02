import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Application } from '@shared/Application';
import { ApplicationEntry } from './ApplicationEntry';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { EnableApplicationRequest } from './models/EnableApplicationRequest';
import { DisableApplicationRequest } from './models/DisableApplicationRequest';

import './Applications.scss';

interface Props {
}

interface State {
  applications: Application[];
}

export class Applications extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _applicationsStateStoreSubscription: Subscription;
  private _simulationIdStateStoreSubscription: Subscription;
  private _simulationId: string;

  constructor(props: Props) {
    super(props);

    this.state = {
      applications: []
    };

    this.enableSelectedApplication = this.enableSelectedApplication.bind(this);
    this.disableSelectedApplication = this.disableSelectedApplication.bind(this);
  }

  componentDidMount() {
    this._applicationsStateStoreSubscription = this._stateStore.select('applications')
      .subscribe({
        next: applications => this.setState({ applications: applications })
      });
    this._simulationIdStateStoreSubscription = this._stateStore.select('startSimulationResponse')
      .pipe(filter(state => Boolean(state)))
      .subscribe({
        next: startSimulationResponse => this._simulationId = startSimulationResponse.simulationId
      });
  }

  componentWillUnmount() {
    this._applicationsStateStoreSubscription.unsubscribe();
    this._simulationIdStateStoreSubscription.unsubscribe();
  }

  render() {
    return (
      <table className='applications'>
        <thead>
          <tr>
            <th>Action</th>
            <th>Application ID</th>
            <th>Description</th>
            <th>Creator</th>
          </tr>
        </thead>
        <tbody>
          {
            this.state.applications.map((application, index) => (
              <ApplicationEntry
                key={index}
                application={application}
                onApplicationEnabled={this.enableSelectedApplication}
                onApplicationDisabled={this.disableSelectedApplication} />
            ))
          }
        </tbody>
      </table>
    );
  }

  enableSelectedApplication(application: Application) {
    const request = new EnableApplicationRequest(application, this._simulationId);
    this._stompClientService.send(
      request.url,
      { 'reply-to': request.replyTo },
      JSON.stringify(request.requestBody)
    );
  }

  disableSelectedApplication(application: Application) {
    const request = new DisableApplicationRequest(application, this._simulationId);
    this._stompClientService.send(
      request.url,
      { 'reply-to': request.replyTo },
      JSON.stringify(request.requestBody)
    );
  }

}
