import * as React from 'react';

import './DialogContent.scss';

interface Props {
  children: any;
}

export const DialogContent = (props: Props) => (
  <div className='dialog-content'>
    {props.children}
  </div>
);