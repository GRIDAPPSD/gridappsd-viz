
import { Component } from 'react';

import { MessageBanner } from '@client:common/overlay/message-banner';

import { RequestEditor } from '../DataBrowser';

import './Simulations.light.scss';
import './Simulations.dark.scss';

interface Props {
}

interface State {
}

export class Simulations extends Component<Props, State> {

  constructor(props: Props) {
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
