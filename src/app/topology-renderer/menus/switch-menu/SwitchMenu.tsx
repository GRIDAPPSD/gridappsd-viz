import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { SelectFormControl } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
import { BasicButton } from '@shared/buttons';

import './SwitchMenu.scss';

interface Props {
  onConfirm: (open: boolean) => void;
  onCancel: () => void;
  left: number;
  top: number;
  open: boolean;
}

interface State {
  switchOpen: boolean
}

export class SwitchMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      switchOpen: props.open
    };
  }

  render() {
    return (
      <Dialog
        className='switch-menu'
        show={true}
        styles={{ left: this.props.left + 'px', top: this.props.top + 'px' }}>
        <DialogContent styles={{ overflow: 'hidden' }}>
          <form className='switch-menu__form'>
            <SelectFormControl
              label='Action'
              menuItems={[
                new MenuItem('Open', true),
                new MenuItem('Close', false),
              ]}
              defaultSelectedIndex={this.props.open ? 0 : 1}
              onChange={menuItem => this.setState({ switchOpen: menuItem.value })} />
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
            disabled={this.state.switchOpen === this.props.open}
            onClick={() => this.props.onConfirm(this.state.switchOpen)} />
        </DialogActions>
      </Dialog>
    );
  }
}