import { Service } from '@shared/Service';

export interface ServiceConfigurationEntryModel {
  service: Service;
  values: {
    [key: string]: any;
  };
  isValid: boolean;
}
