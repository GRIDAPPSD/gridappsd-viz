import * as React from 'react';

import { PopUp } from '../pop-up/PopUp';

import './Dialog.scss';

interface Props {
  children: any;
  show: boolean;
}

export const Dialog = (props: Props) => (
  <PopUp in={props.show}>
    <div className='dialog'>
      {props.children}
    </div>
  </PopUp>
);