import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { SelectFormControl, CheckBox } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
import { BasicButton } from '@shared/buttons';
import { CapacityMenuFormValue } from '../../models/CapacityMenuFormValue';

import './CapacitorMenu.scss';

interface Props {
  onConfirm: (formValue: CapacityMenuFormValue) => void;
  onCancel: () => void;
  left: number;
  top: number;
  open: boolean;
  manual: boolean;
}

interface State {
}

export class CapacitorMenu extends React.Component<Props, State> {
  private readonly _formValue: CapacityMenuFormValue;

  constructor(props: Props) {
    super(props);
    this.state = {
    };

    this._formValue = {
      open: props.open,
      manual: props.manual
    };
  }

  render() {
    return (
      <Dialog
        className='capacitor-menu'
        show={true}
        styles={{ left: this.props.left + 'px', top: this.props.top + 'px' }}>
        <DialogContent styles={{ overflow: 'hidden', width: '300px' }}>
          <form className='capacitor-menu__form'>
            <SelectFormControl
              label='Action'
              menuItems={[
                new MenuItem('Open', true),
                new MenuItem('Close', false),
              ]}
              defaultSelectedIndex={this.props.open ? 0 : 1}
              onChange={menuItem => this._formValue.open = menuItem.value} />
            <CheckBox
              label='Control mode'
              name='control-mode'
              hint='Manual'
              checked={this.props.manual}
              onChange={state => this._formValue.manual = state} />
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.props.onCancel} />
          <BasicButton
            type='positive'
            label='Apply'
            onClick={() => this.props.onConfirm(this._formValue)} />
        </DialogActions>
      </Dialog>
    );
  }
}