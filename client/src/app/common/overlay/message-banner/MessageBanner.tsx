import * as React from 'react';

import { Fade } from '@client:common/effects/fade';
import { Backdrop } from '@client:common/overlay/backdrop';

import './MessageBanner.light.scss';
import './MessageBanner.dark.scss';

export class MessageBanner extends React.Component<unknown, unknown> {

  render() {
    return (
      <Fade in>
        <div className='message-banner'>
          <Backdrop visible />
          <div className='message-banner__content'>
            {this.props.children}
          </div>
        </div>
      </Fade>
    );
  }

}
