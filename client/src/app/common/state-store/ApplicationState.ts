import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@client:common/test-manager';
import { Application } from '@client:common/Application';
import { Service } from '@client:common/Service';
import { ModelDictionary, ModelDictionaryComponent } from '@client:common/topology';
import { PlotModel } from '@client:common/plot-model/PlotModel';
import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { CurrentLimit } from '@client:common/measurement-limits';
import { TimeZone } from '@client:common/DateTimeService';

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
