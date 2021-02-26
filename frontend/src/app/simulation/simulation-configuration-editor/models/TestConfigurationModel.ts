import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@shared/test-manager';

export interface TestConfigurationModel {
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: ScheduledCommandEvent[];
}
