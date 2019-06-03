import * as React from 'react';

import { Ripple } from '@shared/ripple';

import './DrawerItem.scss';

export const DrawerItem = ({ className = '', onClick = (() => { }), children }) => (
  <Ripple>
    <li
      className={'drawer-item' + (className ? ' ' + className : '')}
      onClick={onClick}>
      <div>
        {children}
      </div>
    </li>
  </Ripple>
);

type IconName = 'assignment' | 'storage' | 'search' | 'laptop' | 'memory';

interface DrawerItemIconProps {
  icon: IconName;
}

export const DrawerItemIcon = (props: DrawerItemIconProps) => (
  <i className={'material-icons drawer-item-icon drawer-item-icon__' + props.icon}>{props.icon}</i>
);

export const DrawerItemLabel = ({ className = '', value }) => (
  <span className={'drawer-item-label' + (className ? ' ' + className : '')}>
    {value}
  </span>
);