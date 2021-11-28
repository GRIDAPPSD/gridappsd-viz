import { PortalRenderer } from '@client:common/overlay/portal-renderer';
import { Backdrop } from '@client:common/overlay/backdrop';
import { Fade } from '@client:common/effects/fade';

import './MatchedNodeLocator.light.scss';
import './MatchedNodeLocator.dark.scss';

interface Props {
  node: SVGCircleElement;
  onDimissed: () => void;
}

export function MatchedNodeLocator(props: Props) {
  const matchedNodeBoundingBox = props.node.getBoundingClientRect();
  const rippleRadius = 20;
  const x = matchedNodeBoundingBox.left + matchedNodeBoundingBox.width / 2;
  const y = matchedNodeBoundingBox.top + matchedNodeBoundingBox.height / 2;
  return (
    <PortalRenderer>
      <Fade in={true}>
        <div
          className='matched-node-locator'
          onClick={props.onDimissed}>
          <Backdrop visible={true} />
          <svg>
            <circle
              className='matched-node-locator__ripple'
              cx={x}
              cy={y}
              r={matchedNodeBoundingBox.width < rippleRadius * 2 ? rippleRadius : matchedNodeBoundingBox.width / 2}
              style={{
                transformOrigin: `${x}px ${y}px`
              }}
            />
          </svg>
        </div>
      </Fade>
    </PortalRenderer>
  );
}
