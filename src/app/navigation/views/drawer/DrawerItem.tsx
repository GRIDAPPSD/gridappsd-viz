import * as React from 'react';

import { Ripple } from '@shared/ripple';

import './DrawerItem.scss';

interface DrawerItemProps {
  className?: string;
  onClick?: (event: React.SyntheticEvent) => void;
  children: any;
}

export function DrawerItem(props: DrawerItemProps) {
  return (
    <Ripple>
      <li
        className={'drawer-item' + (props.className ? ' ' + props.className : '')}
        onClick={props.onClick}>
        <div className='drawer-item-wrapper'>
          {props.children}
        </div>
      </li>
    </Ripple>
  );
}

type IconName = 'assignment' | 'storage' | 'search' | 'laptop' | 'memory';

interface DrawerItemIconProps {
  icon: IconName;
}

export function DrawerItemIcon(props: DrawerItemIconProps) {
  return (
    <i className={'material-icons drawer-item-icon drawer-item-icon__' + props.icon}>{props.icon}</i>
  );
}

interface DrawerItemLabelProps {
  className?: string;
  value: string;
}

export function DrawerItemLabel(props: DrawerItemLabelProps) {
  return (
    <span className={'drawer-item-label' + (props.className ? ' ' + props.className : '')}>
      {props.value}
    </span>
  );
}
