export interface ApplicationConfigurationModel {
  applications: Array<{
    name: string;
    // eslint-disable-next-line camelcase
    config_string: string;
  }>;
}
