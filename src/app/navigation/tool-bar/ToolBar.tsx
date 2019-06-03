import * as React from 'react';

import './ToolBar.scss';

export function ToolBar(props: {children: any}) {
  return (
    <nav className='tool-bar'>
      {props.children}
    </nav>
  );
}
