import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@shared/test-manager';

export interface TestConfigurationModel {
  commOutageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  scheduledCommandEvents: ScheduledCommandEvent[];
}
