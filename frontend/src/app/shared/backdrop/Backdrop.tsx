import * as React from 'react';

import { Fade } from '../fade/Fade';

import './Backdrop.light.scss';
import './Backdrop.dark.scss';

export function Backdrop({ visible, onClick = null, transparent = false }) {
  return (
    <Fade in={visible}>
      <div className={`backdrop${transparent ? ' transparent' : ''}`} onClick={onClick} />
    </Fade>
  );
}
