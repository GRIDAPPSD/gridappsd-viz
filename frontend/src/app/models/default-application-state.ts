import { ApplicationState } from '@shared/state-store';

export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  simulationId: '',
  faultMRIDs: [],
  faultEvents: [],
  commOutageEvents: [],
  scheduledCommandEvents: [],
  applications: [],
  services: [],
  modelDictionary: null,
  modelDictionaryComponents: [],
  plotModels: [],
  activeSimulationIds: [],
  nodeNameToLocate: '',
  expectedResultComparisonType: null,
  currentLimits: []
};
