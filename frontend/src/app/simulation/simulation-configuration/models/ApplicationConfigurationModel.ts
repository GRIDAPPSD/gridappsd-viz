export interface ApplicationConfigurationModel {
  applications: Array<{
    name: string;
    config_string: string;
  }>;
}
