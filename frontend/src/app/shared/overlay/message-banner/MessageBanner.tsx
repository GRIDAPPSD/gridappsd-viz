import * as React from 'react';

import { Fade } from '@shared/effects/fade';
import { Backdrop } from '@shared/overlay/backdrop';

import './MessageBanner.light.scss';
import './MessageBanner.dark.scss';

interface Props {

}

interface State {

}
export class MessageBanner extends React.Component<Props, State> {

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
