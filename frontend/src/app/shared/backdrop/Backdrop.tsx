import * as React from 'react';

import { Fade } from '../fade/Fade';

import './Backdrop.light.scss';
import './Backdrop.dark.scss';

export function Backdrop({ visible, onClick = null }) {
  return (
    <Fade in={visible}>
      <div className={'backdrop'} onClick={onClick} />
    </Fade>
  );
}
