import { CommOutageEvent, FaultEvent, ScheduledCommandEvent } from '@client:common/test-manager';

export interface TestConfigurationModel {
  commOutageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  scheduledCommandEvents: ScheduledCommandEvent[];
}
