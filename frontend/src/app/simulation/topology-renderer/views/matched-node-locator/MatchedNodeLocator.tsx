import * as React from 'react';

import { PortalRenderer } from '@shared/portal-renderer';
import { Backdrop } from '@shared/backdrop';
import { Fade } from '@shared/fade';

import './MatchedNodeLocator.light.scss';
import './MatchedNodeLocator.dark.scss';

interface Props {
  node: SVGCircleElement;
  onDimissed: () => void;
}

export function MatchedNodeLocator(props: Props) {
  const matchedNodeBoundingBox = props.node.getBoundingClientRect();
  const rippleSize = 40;

  return (
    <PortalRenderer>
      <Fade in={true}>
        <div
          className='matched-node-locator'
          onClick={props.onDimissed}>
          <Backdrop visible={true} />
          <div
            className='matched-node-locator__ripple'
            style={{
              left: matchedNodeBoundingBox.left - rippleSize / 4,
              top: matchedNodeBoundingBox.top - rippleSize / 4,
              width: rippleSize,
              height: rippleSize
            }} />
        </div>
      </Fade>
    </PortalRenderer>
  );
}
