import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { Select, SelectionOptionBuilder, FormControlModel } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Switch } from '@shared/topology';

import './SwitchControlMenu.light.scss';
import './SwitchControlMenu.dark.scss';

interface Props {
  left: number;
  top: number;
  switch: Switch;
  onSubmit: (open: boolean) => void;
  onAfterClosed: () => void;
}

interface State {
  show: boolean;
  switchStateOptionBuilder: SelectionOptionBuilder<boolean>;
  disableApplyButton: boolean;
}

export class SwitchControlMenu extends React.Component<Props, State> {

  readonly openStateFormControlModel = new FormControlModel(this.props.switch.open);

  constructor(props: Props) {
    super(props);

    this.state = {
      show: true,
      switchStateOptionBuilder: new SelectionOptionBuilder(
        [true, false],
        open => open ? 'Open' : 'Close'
      ),
      disableApplyButton: true
    };

    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.openStateFormControlModel.valueChanges()
      .subscribe({
        next: value => {
          this.setState({
            disableApplyButton: value === this.props.switch.open
          });
        }
      });
  }

  componentWillUnmount() {
    this.openStateFormControlModel.cleanup();
  }

  render() {
    return (
      <Dialog
        className='switch-control-menu'
        show={this.state.show}
        top={this.props.top}
        left={this.props.left}
        onAfterClosed={this.props.onAfterClosed}>
        <DialogContent style={{ overflow: 'hidden' }}>
          <form className='switch-control-menu__form'>
            <Select
              label='Action'
              selectionOptionBuilder={this.state.switchStateOptionBuilder}
              selectedOptionFinder={action => action === this.props.switch.open}
              formControlModel={this.openStateFormControlModel} />
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.onClose} />
          <BasicButton
            type='positive'
            label='Apply'
            disabled={this.state.disableApplyButton}
            onClick={this.onSubmit} />
        </DialogActions>
      </Dialog>
    );
  }

  onClose() {
    this.setState({
      show: false
    });
  }

  onSubmit() {
    this.props.onSubmit(this.openStateFormControlModel.getValue());
    this.setState({
      show: false
    });
  }

}
