import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@shared/test-manager';
import { Application } from '@shared/Application';
import { Service } from '@shared/Service';
import { ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { ExpectedResultComparisonType } from '@shared/ExpectedResultComparisonType';
import { CurrentLimit } from '@shared/measurement-limits';
import { TimeZone } from '@shared/DateTimeService';

export interface ApplicationState {
  simulationId: string;
  faultMRIDs: string[];
  commOutageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  scheduledCommandEvents: ScheduledCommandEvent[];
  applications: Application[];
  services: Service[];
  modelDictionary: ModelDictionary;
  modelDictionaryComponents: ModelDictionaryComponent[];
  plotModels: PlotModel[];
  activeSimulationIds: string[];
  nodeNameToLocate: string;
  expectedResultComparisonType: ExpectedResultComparisonType;
  currentLimits: CurrentLimit[];
  timeZone: TimeZone;
}
