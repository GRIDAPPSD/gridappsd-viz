import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Application } from '@shared/Application';
import { AvailableApplicationListItem } from './AvailableApplicationListItem';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { EnableApplicationRequest } from './models/EnableApplicationRequest';
import { DisableApplicationRequest } from './models/DisableApplicationRequest';
import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';

import './AvailableApplicationList.scss';

interface Props {
}

interface State {
  applications: Application[];
  action: 'enable' | 'disable';
}

export class AvailableApplicationList extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _applicationsStateStoreSubscription: Subscription;
  private _simulationIdStateStoreSubscription: Subscription;
  private _simulationId: string;

  constructor(props: Props) {
    super(props);

    this.state = {
      applications: [],
      action: 'disable'
    };

    this.enableApplication = this.enableApplication.bind(this);
    this.disableApplication = this.disableApplication.bind(this);

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
      <div className='available-application-list'>
        <div className='available-application-list__action'>
          {this.showActionButton()}
        </div>
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Description</th>
              <th>Creator</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.applications.map((application, index) => (
                <AvailableApplicationListItem
                  key={index}
                  application={application} />
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }

  showActionButton() {
    if (this.state.action === 'enable')
      return (
        <Tooltip content='Enable'>
          <IconButton
            icon='cached'
            size='small'
            onClick={this.enableApplication} />
        </Tooltip>
      );

    return (
      <Tooltip content='Disable'>
        <IconButton
          icon='close'
          style='accent'
          size='small'
          onClick={this.disableApplication} />
      </Tooltip>
    );
  }

  enableApplication() {
    this.setState({
      action: 'disable'
    });
    const application = this.state.applications[0];
    const request = new EnableApplicationRequest(application, this._simulationId);
    this._stompClientService.send(
      request.url,
      { 'reply-to': request.replyTo },
      JSON.stringify(request.requestBody)
    );
  }

  disableApplication() {
    this.setState({
      action: 'enable'
    });
    const application = this.state.applications[0];
    const request = new DisableApplicationRequest(application, this._simulationId);
    this._stompClientService.send(
      request.url,
      { 'reply-to': request.replyTo },
      JSON.stringify(request.requestBody)
    );
  }

}
