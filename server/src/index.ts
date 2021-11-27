import * as http from 'http';

import * as express from 'express';
import { Server } from 'socket.io';

import { SimulationStatus } from '@project:common/SimulationStatus';

import { App } from './App';
import { SimulationCoordinator } from './simulation-coordination/SimulationCoordinator';

const port = process.env.PORT || '8092';
const expressInstance = express();
const expressServer = http.createServer(expressInstance);
const socketServer = new Server(expressServer);
const app = new App(expressInstance);
const simulationCoordinator = new SimulationCoordinator();

socketServer.on('connection', socket => {
  const participant = simulationCoordinator.createNewParticipant(socket);

  participant.simulationStatusChanges()
    .subscribe({
      next: payload => {
        switch (payload.status) {
          case SimulationStatus.STARTED:
            simulationCoordinator.startSimulationChannel(payload.simulationId, participant);
            break;
          case SimulationStatus.STOPPED:
            simulationCoordinator.deactivateSimulationChannel(payload.simulationId, participant);
            break;
          case SimulationStatus.RESUMED:
            simulationCoordinator.resumeSimulationChannel(payload.simulationId);
            break;
          case SimulationStatus.PAUSED:
            simulationCoordinator.pauseSimulationChannel(payload.simulationId);
            break;
        }
      }
    });

  participant.requestToJoinSimulationChannel()
    .subscribe({
      next: (simulationId: string) => {
        simulationCoordinator.addParticipantToSimulationChannel(simulationId, participant);
      }
    });
});

app.start();

// eslint-disable-next-line no-console
expressServer.listen(port, () => console.log(`Server started on port ${port}`));
