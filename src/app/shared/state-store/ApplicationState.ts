import { CommOutageEvent, FaultEvent } from '@shared/test-manager';
import { Application } from '@shared/Application';
import { Service } from '@shared/Service';
import { ModelDictionary, ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';

export interface ApplicationState {
  startSimulationResponse: {
    simulationId: string;
    events: Array<{
      allOutputOutage: boolean;
      allInputOutage: boolean;
      inputOutageList: Array<{ objectMrid: string; attribute: string; }>;
      outputOutageList: string[];
      faultMRID: string;
      event_type: string;
      occuredDateTime: number;
      stopDateTime: number;
      PhaseConnectedFaultKind: string;
      phases: string;
    }>;
  };
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  applications: Application[];
  services: Service[];
  modelDictionary: ModelDictionary;
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
  plotModels: PlotModel[];
}
