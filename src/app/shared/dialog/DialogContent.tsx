import * as React from 'react';

import './DialogContent.scss';

interface Props {
  children: any;
  styles?: React.CSSProperties;
}

export function DialogContent(props: Props) {
  return (
    <div className='dialog-content' style={{ ...(props.styles || {}) }}>
      {props.children}
    </div>
  );
}
