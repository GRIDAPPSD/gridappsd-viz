import * as React from 'react';

import { StompClientService } from '@client:common/StompClientService';

import { GetAvailableApplicationsAndServicesRequest } from './models/GetAvailableApplicationsAndServicesRequest';
import { ResponseBody } from './models/ResponseBody';
import { AvailableApplicationsAndServices } from './AvailableApplicationsAndServices';

interface Props {

}

interface State {
  responseBody: ResponseBody;
}
export class AvailableApplicationsAndServicesContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      responseBody: null
    };

  }

  componentDidMount() {
    this._fetchAvailableApplicationsAndServices();
  }

  private _fetchAvailableApplicationsAndServices() {
    const getApplicationsAndServicesRequest = new GetAvailableApplicationsAndServicesRequest();
    this._subscribeForApplicationAndServicesResponse(getApplicationsAndServicesRequest.replyTo);
    this._stompClientService.send({
      destination: getApplicationsAndServicesRequest.url,
      replyTo: getApplicationsAndServicesRequest.replyTo,
      body: JSON.stringify(getApplicationsAndServicesRequest.requestBody)
    });
  }

  private _subscribeForApplicationAndServicesResponse(topic: string) {
    this._stompClientService.readOnceFrom<ResponseBody>(topic)
      .subscribe({
        next: responseBody => {
          this.setState({
            responseBody
          });
        }
      });
  }

  render() {
    return (
      <AvailableApplicationsAndServices responseBody={this.state.responseBody} />
    );
  }

}
