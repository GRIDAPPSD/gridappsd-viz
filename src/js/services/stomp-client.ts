import { client, Client } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';

const STOMP_CLIENT: Client = client(RUN_CONFIG.gossServerUrl);
STOMP_CLIENT.heartbeat.outgoing = 0; // client will send heartbeats every 20000ms
STOMP_CLIENT.heartbeat.incoming = 0;

export { STOMP_CLIENT };