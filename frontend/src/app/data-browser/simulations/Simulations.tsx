import * as React from 'react';

import { RequestEditor } from '../DataBrowser';
import { MessageBanner } from '@shared/overlay/message-banner';

import './Simulations.light.scss';
import './Simulations.dark.scss';

interface Props {
}

interface State {
}

export class Simulations extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  render() {
    const requestEditorContainerStyles = { height: '100%', maxHeight: '100%' };
    return (
      <RequestEditor style={requestEditorContainerStyles}>
        <MessageBanner>
          Not yet implemented
        </MessageBanner>
      </RequestEditor>
    );
  }

}
