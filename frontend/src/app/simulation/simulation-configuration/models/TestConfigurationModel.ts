import { CommOutageEvent, FaultEvent, CommandEvent } from '@shared/test-manager';

export interface TestConfigurationModel {
  outageEvents: CommOutageEvent[];
  faultEvents: FaultEvent[];
  commandEvents: CommandEvent[];
}
