import * as React from 'react';

import { Fade } from '../fade/Fade';

import './Backdrop.scss';

export function Backdrop({ visible, onClick = null }) {
  return (
    <Fade fadeIn={visible}>
      <div className={'backdrop'} onClick={onClick} />
    </Fade>
  );
}
