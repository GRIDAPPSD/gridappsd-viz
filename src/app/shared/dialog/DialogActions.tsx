import * as React from 'react';

import './DialogActions.scss';

interface Props {
  children: any;
}

export function DialogActions(props: Props) {
  return (
    <div className='dialog-actions'>
      {props.children}
    </div>
  );
}
