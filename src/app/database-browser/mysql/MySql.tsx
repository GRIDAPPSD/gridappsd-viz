import * as React from 'react';

import { RequestEditor } from '../RequestEditor';

import './MySql.scss';

interface Props {
}

interface State {
}

export class MySql extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
  }

  render() {
    const requestEditorContainerStyles = { height: '100%', maxHeight: '100%' };
    return (
      <RequestEditor styles={requestEditorContainerStyles}>
        <h1>Not yet implemented</h1>
      </RequestEditor>
    );
  }

}