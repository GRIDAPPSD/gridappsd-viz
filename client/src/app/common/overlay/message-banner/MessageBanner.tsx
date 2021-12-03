import { ReactNode } from 'react';

import { Fade } from '@client:common/effects/fade';
import { Backdrop } from '@client:common/overlay/backdrop';

import './MessageBanner.light.scss';
import './MessageBanner.dark.scss';

interface Props {
  children: ReactNode | ReactNode[];
}

export function MessageBanner(props: Props) {
  return (
    <Fade in>
      <div className='message-banner'>
        <Backdrop visible />
        <div className='message-banner__content'>
          {props.children}
        </div>
      </div>
    </Fade>
  );
}
