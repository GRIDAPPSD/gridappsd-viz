import * as React from 'react';

import { FilePickerService } from './FilePickerService';
import { PortalRenderer } from '@shared/overlay/portal-renderer';

import './FilePicker.light.scss';
import './FilePicker.dark.scss';

interface Props {
}

interface State {
}

export class FilePicker extends React.Component<Props, State> {

  private readonly _filePickerService = FilePickerService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
    };

    this.onFilePicked = this.onFilePicked.bind(this);
  }

  render() {
    return (
      <PortalRenderer containerClassName='file-picker-container'>
        <form className='file-picker'>
          <input
            className='file-picker__input'
            accept='.json, application/json'
            type='file'
            name='filePicker'
            onChange={this.onFilePicked} />
        </form>
      </PortalRenderer>
    );
  }

  onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    this._filePickerService.selectFile(event.target.files[0]);
  }

}
