import * as React from 'react';

import './DialogContent.scss';

interface Props {
  children: any;
  styles?: React.CSSProperties;
}

export const DialogContent = (props: Props) => (
  <div className='dialog-content' style={{ ...(props.styles || {}) }}>
    {props.children}
  </div>
);