import * as React from 'react';

import { IconButton } from '@shared/buttons';

import './DrawerOpener.scss';

export function DrawerOpener({ onClick }) {
  return (
    <IconButton
      style='default'
      className='drawer-opener'
      icon='menu'
      onClick={onClick} />
  );
}
