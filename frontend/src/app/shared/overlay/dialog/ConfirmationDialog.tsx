import * as React from 'react';

import './ConfirmationDialog.light.scss';
import './ConfirmationDialog.dark.scss';

import { Dialog } from './Dialog';
import { DialogContent } from './DialogContent';
import { DialogActionGroup } from './DialogActionGroup';
import { BasicButton } from '@shared/buttons';
import { PortalRenderer } from '@shared/overlay/portal-renderer';

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

interface State {
  open: boolean;
}

export class ConfirmationDialog extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      open: true
    };

  }

  static open(message: string) {
    return new Promise<void>((resolve, reject) => {
      const portalRenderer = new PortalRenderer({ containerClassName: 'confirmation-dialog-container' });
      portalRenderer.mount(
        <ConfirmationDialog
          onConfirm={() => {
            resolve();
            portalRenderer.unmount();
          }}
          onCancel={() => {
            reject();
            portalRenderer.unmount();
          }}>
          {message}
        </ConfirmationDialog>
      );
    });
  }

  render() {
    return (
      <Dialog
        open={this.state.open}
        className='confirmation-dialog'>
        <DialogContent>
          {this.props.children}
        </DialogContent>
        <DialogActionGroup>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={() => {
              this.setState({
                open: false
              });
              this.props.onCancel();
            }} />
          <BasicButton
            type='positive'
            label='Confirm'
            onClick={() => {
              this.setState({
                open: false
              });
              this.props.onConfirm();
            }} />
        </DialogActionGroup>
      </Dialog>
    );
  }

}
