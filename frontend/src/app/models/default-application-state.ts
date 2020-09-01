import { ApplicationState } from '@shared/state-store';

export const DEFAULT_APPLICATION_STATE: ApplicationState = {
  simulationId: '',
  faultMRIDs: [],
  faultEvents: [],
  outageEvents: [],
  commandEvents: [],
  applications: [],
  services: [],
  modelDictionary: null,
  modelDictionaryComponents: [],
  plotModels: [],
  activeSimulationIds: [],
  nodeNameToLocate: '',
  expectedResultComparisonType: null
};
