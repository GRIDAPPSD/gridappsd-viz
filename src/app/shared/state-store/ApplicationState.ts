import { CommOutageEvent, FaultEvent } from '@shared/test-manager';
import { Application } from '@shared/Application';
import { Service } from '@shared/Service';
import { ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';

export interface ApplicationState {
  simulationId: string;
  faultMRIDs: string[];
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  applications: Application[];
  services: Service[];
  modelDictionary: ModelDictionary;
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
  plotModels: PlotModel[];
}
