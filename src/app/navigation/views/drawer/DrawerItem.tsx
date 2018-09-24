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

type IconName = 'form' | 'app' | 'browse' | 'terminal';

interface DrawerItemIconProps {
  icon: IconName
}
export const DrawerItemIcon = (props: DrawerItemIconProps) => (
  <i className={'app-icon drawer-item__icon drawer-item__icon__' + props.icon} />
);

export const DrawerItemLabel = ({ className = '', value }) => (
  <span className={'drawer-item__label' + (className ? ' ' + className : '')}>
    {value}
  </span>
);