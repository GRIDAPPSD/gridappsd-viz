import * as React from 'react';

import { Ripple } from '../../../shared/views/ripple/Ripple';

import './DrawerItem.scss';

export const DrawerItem = ({ className = '', onClick = (() => { }), children }) => (
  <Ripple>
    <li
      className={'drawer-item' + (className ? ' ' + className : '')}
      onClick={onClick}>
      {children}
    </li>
  </Ripple>
);

export const DrawerItemIcon = ({ iconClassName = '' }) => (
  <i className={'app-icon drawer-item__icon' + (iconClassName ? ' ' + iconClassName : '')} />
);

export const DrawerItemLabel = ({ className = '', value }) => (
  <span className={'drawer-item__label' + (className ? ' ' + className : '')}>
    {value}
  </span>
);