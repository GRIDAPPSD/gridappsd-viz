
import { Ripple } from '@client:common/ripple';

import './DrawerItem.light.scss';
import './DrawerItem.dark.scss';

interface DrawerItemProps {
  className?: string;
  onClick?: (event: React.SyntheticEvent) => void;
  children: React.ReactChild[] | React.ReactChild;
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

interface DrawerItemIconProps {
  icon: 'assignment' | 'storage' | 'search' | 'laptop' | 'memory' | 'power_settings_new' | 'merge_type' | 'compare_arrows' | 'cloud_upload';
}

export function DrawerItemIcon(props: DrawerItemIconProps) {
  return (
    <i className='material-icons drawer-item-icon'>{props.icon}</i>
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
