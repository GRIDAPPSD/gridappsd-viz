import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { Select, Option } from '@shared/form';
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
  switchOpen: boolean;
  options: Option<boolean>[];
}

export class SwitchMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      switchOpen: props.open,
      options: [
        new Option('Open', true),
        new Option('Close', false),
      ]
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
            <Select
              multiple={false}
              label='Action'
              options={this.state.options}
              isOptionSelected={option => option.value === this.props.open}
              onChange={selectedOption => this.setState({ switchOpen: selectedOption.value })} />
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