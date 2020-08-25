import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';

import { App } from './App';
import { SimulationCoordinator } from './simulation-coordination/SimulationCoordinator';
import { SimulationStatus } from '@common/SimulationStatus';

const EXPRESS = express();
const expressServer = http.createServer(EXPRESS);
const socketServer = socketIo(expressServer);
const port = process.env.PORT || 8092;
const app = new App(EXPRESS);
const simulationCoordinator = new SimulationCoordinator();

app.onGetConfigFile((_, response) => response.sendFile('/config.json'));

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

// eslint-disable-next-line no-console
expressServer.listen(port, () => console.log(`Server started on port ${port}`));
