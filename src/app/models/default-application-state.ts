import { ApplicationState } from '@shared/state-store';

export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  startSimulationResponse: {
    simulationId: '',
    events: []
  },
  faultEvents: [],
  outageEvents: [],
  applications: [],
  services: [],
  modelDictionary: null
};
