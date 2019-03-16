import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { CheckBox } from '@shared/form';
import { BasicButton } from '@shared/buttons';

import './RegulatorMenu.scss';

interface Props {
  onConfirm: (open: boolean) => void;
  onCancel: () => void;
  left: number;
  top: number;
  manual: boolean;
}

interface State {
  manual: boolean
}

export class RegulatorMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      manual: props.manual
    };
  }

  render() {
    return (
      <Dialog
        className='regulator-menu'
        show={true}
        styles={{ left: this.props.left + 'px', top: this.props.top + 'px' }}>
        <DialogContent styles={{ overflow: 'hidden', width: '300px' }}>
          <form className='regulator-menu__form'>
            <CheckBox
              label='Control mode'
              name='control-mode'
              hint='Manual'
              checked={this.props.manual}
              onChange={state => this.setState({ manual: state })} />
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
            disabled={this.state.manual === this.props.manual}
            onClick={() => this.props.onConfirm(this.state.manual)} />
        </DialogActions>
      </Dialog>
    );
  }
}