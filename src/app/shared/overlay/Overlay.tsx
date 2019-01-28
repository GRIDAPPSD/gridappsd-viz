import * as React from 'react';

import { Backdrop } from '../backdrop/Backdrop';

import './Overlay.scss';

interface Props {
  element: React.ReactElement<any>;
}

export const Overlay = (props: Props) => (
  <div className='overlay'>
    <Backdrop visible />
    {props.element}
  </div>
);