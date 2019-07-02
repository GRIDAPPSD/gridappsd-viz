import * as React from 'react';

import { Application } from '@shared/Application';
import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';

import './ApplicationEntry.scss';

interface Props {
  application: Application;
  onApplicationEnabled: (application: Application) => void;
  onApplicationDisabled: (application: Application) => void;
}

interface State {
  action: 'enable' | 'disable';
}

export class ApplicationEntry extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      action: 'enable'
    };

    this.enableApplication = this.enableApplication.bind(this);
    this.disableApplication = this.disableApplication.bind(this);
  }

  render() {
    return (
      <tr className='application'>
        <td className='application__action'>
          <div>
            {this.showActionButton()}
          </div>
        </td>
        <td className='application__id'>
          <div>
            {this.props.application.id}
          </div>
        </td>
        <td className='application__description'>
          <div>
            {this.props.application.description}
          </div>
        </td>
        <td className='application__creator'>
          <div>
            {this.props.application.creator}
          </div>
        </td>
      </tr>
    );
  }

  showActionButton() {
    if (this.state.action === 'enable')
      return (
        <Tooltip content='Enable'>
          <IconButton
            icon='cached'
            size='small'
            onClick={this.enableApplication} />
        </Tooltip>
      );

    return (
      <Tooltip content='Disable'>
        <IconButton
          icon='delete'
          style='accent'
          size='small'
          onClick={this.disableApplication} />
      </Tooltip>
    );
  }

  enableApplication() {
    this.setState({
      action: 'disable'
    });
    this.props.onApplicationEnabled(this.props.application);
  }

  disableApplication() {
    this.setState({
      action: 'enable'
    });
    this.props.onApplicationDisabled(this.props.application);
  }

}
