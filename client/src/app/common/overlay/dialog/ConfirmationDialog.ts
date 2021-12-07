import { Dialog } from './Dialog';

import './ConfirmationDialog.light.scss';
import './ConfirmationDialog.dark.scss';


export class ConfirmationDialog {

  static open(message: string) {
    return new Promise<void>((resolve, reject) => {
      Dialog.create(message)
        .addClassName('confirmation-dialog')
        .addNegativeButton('Cancel', reject)
        .addPositiveButton('Confirm', resolve)
        .open();
    });
  }

}
