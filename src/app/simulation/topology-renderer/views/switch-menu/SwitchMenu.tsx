import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { Select, SelectionOptionBuilder } from '@shared/form';
import { BasicButton } from '@shared/buttons';

import './SwitchMenu.light.scss';
import './SwitchMenu.dark.scss';

interface Props {
  onConfirm: (open: boolean) => void;
  onCancel: () => void;
  left: number;
  top: number;
  open: boolean;
}

interface State {
  show: boolean;
  switchOpen: boolean;
  switchStateOptionBuilder: SelectionOptionBuilder<boolean>;
}

export class SwitchMenu extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      show: true,
      switchOpen: props.open,
      switchStateOptionBuilder: new SelectionOptionBuilder(
        [true, false],
        open => open ? 'Open' : 'Close'
      )
    };

    this.onCancel = this.onCancel.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  render() {
    return (
      <Dialog
        className='switch-menu'
        show={this.state.show}
        top={this.props.top}
        left={this.props.left}>
        <DialogContent styles={{ overflow: 'hidden' }}>
          <form className='switch-menu__form'>
            <Select
              label='Action'
              selectionOptionBuilder={this.state.switchStateOptionBuilder}
              selectedOptionFinder={action => action === this.props.open}
              onChange={selectedAction => this.setState({ switchOpen: selectedAction })} />
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.onCancel} />
          <BasicButton
            type='positive'
            label='Apply'
            disabled={this.state.switchOpen === this.props.open}
            onClick={this.onConfirm} />
        </DialogActions>
      </Dialog>
    );
  }

  onCancel() {
    this.setState({
      show: false
    }, this.props.onCancel);
  }

  onConfirm() {
    this.props.onConfirm(this.state.switchOpen);
    this.setState({
      show: false
    });
  }

}
