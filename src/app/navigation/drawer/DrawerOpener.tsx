import * as React from 'react';

import { IconButton } from '@shared/buttons';

import './DrawerOpener.scss';

export const DrawerOpener = ({ onClick }) => (
  <IconButton
    style='default'
    className='drawer-opener'
    icon='menu'
    onClick={onClick} />
);