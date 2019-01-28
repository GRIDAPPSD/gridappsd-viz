import * as React from 'react';

import { DropdownMenu } from '../../dropdown-menu/DropdownMenu';
import { MenuItem } from '../../dropdown-menu/MenuItem';

import './SelectFormControl.scss';
interface Props {
  label: string;
  menuItems: MenuItem[];
  onChange: (item: MenuItem, selections: MenuItem[]) => void;
  defaultSelectedIndex?: number;
  multiple?: boolean;
}

export const SelectFormControl = (props: Props) => (
  <div className='gridappsd-form-control'>
    <label className='gridappsd-form-control__label'>{props.label}</label>
    <DropdownMenu
      multiple={props.multiple}
      defaultLabel={props.multiple ? 'Select one or more' : ''}
      menuItems={props.menuItems}
      onChange={props.onChange}
      defaultSelectedIndex={props.defaultSelectedIndex} />
  </div>
);