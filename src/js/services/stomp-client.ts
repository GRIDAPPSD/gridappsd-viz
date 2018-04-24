import { client, Client } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';

export const STOMP_CLIENT: Client = client(RUN_CONFIG.gossServerUrl);
