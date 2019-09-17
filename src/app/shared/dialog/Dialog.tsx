import * as React from 'react';

import { PopUp } from '../pop-up/PopUp';

import './Dialog.scss';

interface Props {
  children: any;
  show: boolean;
  top?: number;
  left?: number;
  className?: string;
  showBackdrop?: boolean;
}

export function Dialog(props: Props) {
  return (
    <PopUp
      top={props.top}
      left={props.left}
      in={props.show}
      showBackdrop={props.showBackdrop === undefined ? true : props.showBackdrop}>
      <div className={'dialog' + (props.className ? ' ' + props.className : '')}>
        {props.children}
      </div>
    </PopUp>
  );
}
