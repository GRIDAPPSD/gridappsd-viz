import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';

import { App } from './App';
import { SimulationCoordinator } from './simulation-coordination/SimulationCoordinator';
import { SimulationStatus } from '@common/SimulationStatus';

const EXPRESS = express();
const EXPRESS_SERVER = http.createServer(EXPRESS);
const SOCKET_SERVER = socketIo(EXPRESS_SERVER);
const PORT = process.env.PORT || 8092;
const APP = new App(EXPRESS);
const SIMULATION_COORDINATOR = new SimulationCoordinator();

APP.onIndex((_, response) => response.sendFile('/index.html'));

APP.onGetConfigFile((_, response) => response.sendFile('/config.json'));

SOCKET_SERVER.on('connection', socket => {
  const participant = SIMULATION_COORDINATOR.createNewParticipant(socket);

  participant.simulationStatusChanges()
    .subscribe({
      next: payload => {
        switch (payload.status) {
          case SimulationStatus.STARTED:
            SIMULATION_COORDINATOR.startSimulationChannel(payload.simulationId, participant);
            break;
          case SimulationStatus.STOPPED:
            SIMULATION_COORDINATOR.deactivateSimulationChannel(payload.simulationId, participant);
            break;
          case SimulationStatus.RESUMED:
            SIMULATION_COORDINATOR.resumeSimulationChannel(payload.simulationId);
            break;
          case SimulationStatus.PAUSED:
            SIMULATION_COORDINATOR.pauseSimulationChannel(payload.simulationId);
            break;
        }
      }
    });

  participant.requestToJoinSimulationChannel()
    .subscribe({
      next: (simulationId: string) => {
        SIMULATION_COORDINATOR.addParticipantToSimulationChannel(simulationId, participant);
      }
    });
});

EXPRESS_SERVER.listen(PORT);
