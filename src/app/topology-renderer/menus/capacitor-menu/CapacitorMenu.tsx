import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { SelectFormControl } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
import { BasicButton } from '@shared/buttons';

import './CapacitorMenu.scss';

interface Props {
  onConfirm: (open: boolean) => void;
  onCancel: () => void;
  left: number;
  top: number;
  open: boolean;
}

interface State {
  capacitorOpen: boolean
}

export class CapacitorMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      capacitorOpen: props.open
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
              onChange={menuItem => this.setState({ capacitorOpen: menuItem.value })} />
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
            disabled={this.state.capacitorOpen === this.props.open}
            onClick={() => this.props.onConfirm(this.state.capacitorOpen)} />
        </DialogActions>
      </Dialog>
    );
  }
}