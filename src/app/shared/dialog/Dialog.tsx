import * as React from 'react';

import { PopUp } from '../pop-up/PopUp';

import './Dialog.scss';

interface Props {
  children: any;
  show: boolean;
  className?: string;
  styles?: React.CSSProperties;
}

export const Dialog = (props: Props) => (
  <PopUp in={props.show}>
    <div className={'dialog' + (props.className ? ' ' + props.className : '')}
      style={{ ...(props.styles || {}) }}>
      {props.children}
    </div>
  </PopUp>
);