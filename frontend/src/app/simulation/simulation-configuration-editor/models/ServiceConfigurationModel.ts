export interface ServiceConfigurationModel {
  id: string;
  // eslint-disable-next-line camelcase
  user_options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}
