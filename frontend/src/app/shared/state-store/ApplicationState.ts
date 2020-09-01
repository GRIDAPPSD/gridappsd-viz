import { CommOutageEvent, FaultEvent, CommandEvent } from '@shared/test-manager';
import { Application } from '@shared/Application';
import { Service } from '@shared/Service';
import { ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { ExpectedResultComparisonType } from '@shared/ExpectedResultComparisonType';

export interface ApplicationState {
  simulationId: string;
  faultMRIDs: string[];
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: CommandEvent[];
  applications: Application[];
  services: Service[];
  modelDictionary: ModelDictionary;
  modelDictionaryComponents: ModelDictionaryComponent[];
  plotModels: PlotModel[];
  activeSimulationIds: string[];
  nodeNameToLocate: string;
  expectedResultComparisonType: ExpectedResultComparisonType;
}
