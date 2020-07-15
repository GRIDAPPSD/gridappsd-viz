export const enum SimulationSynchronizationEvent {
  QUERY_SIMULATION_STATUS = '/simulation/status',
  SEND_SIMULATION_SNAPSHOT = '/simulation/snapshot/send',
  RECEIVE_SIMULATION_SNAPSHOT = '/simulation/snapshot/receive',
  INIT_SIMULATION_SNAPSHOT = '/simulation/snapshot/init',
  JOIN_SIMULATION = '/simulation/join',
  QUERY_ACTIVE_SIMULATION_CHANNELS = '/simulation/channels/active',
}
