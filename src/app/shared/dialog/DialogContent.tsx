import * as React from 'react';

import './DialogContent.light.scss';
import './DialogContent.dark.scss';

interface Props {
  children: any;
  style?: React.CSSProperties;
}

export function DialogContent(props: Props) {
  return (
    <div className='dialog-content' style={{ ...(props.style || {}) }}>
      {props.children}
    </div>
  );
}
