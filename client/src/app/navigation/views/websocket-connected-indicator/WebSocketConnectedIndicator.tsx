import { StompClientConnectionStatus } from '@client:common/StompClientService';

import './WebSocketConnectedIndicator.light.scss';
import './WebSocketConnectedIndicator.dark.scss';

interface Props {
  websocketStatus: StompClientConnectionStatus;
}

export function WebSocketConnectedIndicator(props: Props) {
  if (props.websocketStatus === StompClientConnectionStatus.CONNECTED) {
    return (
      <section className='websocket-connected-indicator'>
        <i className='material-icons websocket-connected-indicator__icon'>import_export</i>
        <div className='websocket-connected-indicator__status-text'>Connected</div>
      </section>
    );
  }
  return null;
}
