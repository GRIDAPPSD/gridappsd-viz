import { Component } from 'react';

import { StompClientService } from '@client:common/StompClientService';
import { Application } from '@client:common/Application';
import { FieldModelConfiguration } from '@client:common/field-model-datastream';

import { GetAvailableApplicationsAndServicesRequest } from './models/GetAvailableApplicationsAndServicesRequest';
import { ResponseBody } from './models/ResponseBody';
import { AvailableApplicationsAndServices } from './AvailableApplicationsAndServices';

interface Props {
  fieldModelMrid?: string;
  availableApplications: Application[];
  initialFieldModelConfig: FieldModelConfiguration;
  fieldModelConfigTabSubmit: (config: FieldModelConfiguration) => void;
}

interface State {
  responseBody: ResponseBody;
}

/**
 * This container component is responsible for any data modeling/fetching. It is the topmost
 * level parent component that ties together different components and data when the menu item
 * "Applications & Services" in the drawer is selected.
 */
export class AvailableApplicationsAndServicesContainer extends Component<Props, State> {

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
      <AvailableApplicationsAndServices
        availableApplications={this.props.availableApplications}
        responseBody={this.state.responseBody}
        fieldModelMrid={this.props.fieldModelMrid}
        initialFieldModelConfig={this.props.initialFieldModelConfig}
        onSubmit={updatedConfig => this.props.fieldModelConfigTabSubmit(updatedConfig)}
      />
    );
  }

}
