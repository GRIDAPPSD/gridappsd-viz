import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
// import { Response } from '../Response';
// import { MRID } from '../../../models/MRID';
// import { DropdownMenu } from '../../dropdown-menu/DropdownMenu';
// import { MenuItem } from '../../dropdown-menu/MenuItem';
// import { QueryBlazeGraphRequestType, QueryBlazeGraphRequestBody, QueryBlazeGraphRequestResultFormat } from '../../../models/message-requests/QueryBlazeGraphRequest';

import './InfluxDb.styles.scss';

interface Props {
}

interface State {
}

export class InfluxDb extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  render() {
    const requestEditorContainerStyles = { height: '100%', maxHeight: '100%' };
    return (
      <>
        <RequestEditor styles={requestEditorContainerStyles}>
          <h1>Not yet implemented</h1>
        </RequestEditor>
      </>
    );
  }

}