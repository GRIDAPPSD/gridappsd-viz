import { ApplicationState } from '@shared/ApplicationState';

export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  simulationStartResponse: {
    simulationId: '',
    events: []
  },
  faultEvents: [],
  outageEvents: []
}
