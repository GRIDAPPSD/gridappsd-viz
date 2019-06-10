export interface ApplicationState {
  simulationStartResponse: {
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
  outageEvents: any[];
  faultEvents: any[];
}
