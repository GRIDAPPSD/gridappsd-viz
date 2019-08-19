import { ApplicationState } from '@shared/state-store';

export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  simulationId: '',
  faultMRIDs: [],
  faultEvents: [],
  outageEvents: [],
  applications: [],
  services: [],
  modelDictionary: null,
  modelDictionaryComponentsWithConsolidatedPhases: [],
  plotModels: [],
  currentUser: null
};
