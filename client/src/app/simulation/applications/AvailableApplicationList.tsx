import { Component } from 'react';
import { Subscription } from 'rxjs';

import { Application } from '@client:common/Application';
import { StateStore } from '@client:common/state-store';
import { Tooltip } from '@client:common/tooltip';
import { IconButton } from '@client:common/buttons';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { StompClientService } from '@client:common/StompClientService';

import { DisableApplicationRequest } from './models/DisableApplicationRequest';
import { EnableApplicationRequest } from './models/EnableApplicationRequest';
import { AvailableApplicationListItem } from './AvailableApplicationListItem';

import './AvailableApplicationList.light.scss';
import './AvailableApplicationList.dark.scss';

interface Props {
}

interface State {
  applications: Application[];
  action: 'enable' | 'disable';
}

export class AvailableApplicationList extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _applicationsStateStoreSubscription: Subscription;
  private _simulationIdStateChangeSubscription: Subscription;
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
        next: applications => this.setState({ applications })
      });
    this._simulationIdStateChangeSubscription = this._stateStore.select('simulationId')
      .subscribe({
        next: simulationId => this._simulationId = simulationId
      });
  }

  componentWillUnmount() {
    this._applicationsStateStoreSubscription.unsubscribe();
    this._simulationIdStateChangeSubscription.unsubscribe();
  }

  render() {
    if (this.state.applications.length === 0) {
      return (
        <MessageBanner>
          No data available
        </MessageBanner>
      );
    }
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
    if (this.state.action === 'enable') {
      return (
        <Tooltip content='Enable'>
          <IconButton
            icon='cached'
            size='small'
            onClick={this.enableApplication} />
        </Tooltip>
      );
    }

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

    this._stompClientService.send({
      destination: request.url,
      replyTo: request.replyTo,
      body: JSON.stringify(request.requestBody)
    });

  }

  disableApplication() {
    this.setState({
      action: 'enable'
    });
    const application = this.state.applications[0];
    const request = new DisableApplicationRequest(application, this._simulationId);
    this._stompClientService.send({
      destination: request.url,
      replyTo: request.replyTo,
      body: JSON.stringify(request.requestBody)
    });
  }

}
