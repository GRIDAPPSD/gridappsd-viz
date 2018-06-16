import * as React from 'react';
import { connect } from 'react-redux';

import { MySql } from './MySql';
// import { AppState } from '../../../models/AppState';
// import { QueryBlazeGraphRequestBody, QueryBlazeGraphRequestType } from '../../../models/message-requests/QueryBlazeGraphRequest';
// import { MessageService } from '../../../services/MessageService';
// import { StompSubscription } from '@stomp/stompjs';


interface Props {
}

interface State {
}

const mapStateToProps = () => ({
});

// let blazeGraphSubscription: StompSubscription = null;

export const MySqlContainer = connect(mapStateToProps)(class MySqlContainer extends React.Component<Props, State> {
  // private readonly _messageService = MessageService.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
    };

  }

  componentDidMount() {
    // if (blazeGraphSubscription) {
    //   blazeGraphSubscription.unsubscribe();
    //   blazeGraphSubscription = null;
    // }
    // blazeGraphSubscription = this._messageService.onBlazeGraphDataReceived((payload, request) => {
    //   console.log(request, payload);
    //   this.setState({ response: JSON.parse(payload.data) });
    // });

  }
  render() {
    return (
      <MySql />
    );
  }

});