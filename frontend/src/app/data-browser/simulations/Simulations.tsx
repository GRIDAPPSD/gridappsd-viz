import * as React from 'react';

import { RequestEditor } from '../RequestEditor';

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
      <>
        <RequestEditor styles={requestEditorContainerStyles}>
          <h1>Not yet implemented</h1>
        </RequestEditor>
      </>
    );
  }

}
