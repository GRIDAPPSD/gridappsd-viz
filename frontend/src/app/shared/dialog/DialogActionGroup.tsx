import * as React from 'react';

import './DialogActionGroup.light.scss';
import './DialogActionGroup.dark.scss';

interface Props {
  children: any;
}

export function DialogActionGroup(props: Props) {
  return (
    <div className='dialog-action-group'>
      {
        props.children
      }
    </div>
  );
}
