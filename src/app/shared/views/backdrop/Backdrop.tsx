import * as React from 'react';

import { Fade } from '../fade/Fade';

import './Backdrop.scss';

export const Backdrop = ({ visible, onClick = (() => { }) }) => (
  <Fade fadeIn={visible}>
    <div className={'backdrop'} onClick={onClick} />
  </Fade>
);