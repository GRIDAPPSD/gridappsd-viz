import * as React from 'react';

import { DropdownMenu } from '../../dropdown-menu/DropdownMenu';
import { MenuItem } from '../../dropdown-menu/MenuItem';

import './SelectFormControl.scss';
interface Props {
  label: string;
  menuItems: MenuItem[];
  onChange: (item: MenuItem) => void;
  defaultSelectedIndex?: number;
}

export const SelectFormControl = (props: Props) => (
  <div className='gridappsd-form-control'>
    <label className='gridappsd-form-control__label'>{props.label}</label>
    <DropdownMenu
      menuItems={props.menuItems}
      onChange={props.onChange}
      defaultSelectedIndex={props.defaultSelectedIndex} />
  </div>
);