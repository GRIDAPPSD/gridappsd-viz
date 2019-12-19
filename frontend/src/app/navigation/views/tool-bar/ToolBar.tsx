import * as React from 'react';

import './ToolBar.light.scss';
import './ToolBar.dark.scss';

export function ToolBar(props: { children: any }) {
  return (
    <nav className='tool-bar'>
      {props.children}
    </nav>
  );
}
