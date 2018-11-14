import * as React from 'react';

import './DialogActions.scss';

interface Props {
  children: any;
}

export const DialogActions = (props: Props) => (
  <div className='dialog-actions'>
    {props.children}
  </div>
);