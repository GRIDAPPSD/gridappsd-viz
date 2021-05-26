export const SCHEDULED_COMMAND_EVENT_ATTRIBUTES = {
  capacitors: [
    'ShuntCompensator.sections'
  ],
  regulators: [
    'TapChanger.step'
  ],
  solarpanels: [
    'PowerElectronicsConnection.p',
    'PowerElectronicsConnection.q'
  ],
  batteries: [
    'PowerElectronicsConnection.p',
    'PowerElectronicsConnection.q'
  ],
  switches: [
    'Switch.open'
  ],
  fuses: [
    'Switch.open'
  ],
  sectionalisers: [
    'Switch.open'
  ],
  breakers: [
    'Switch.open'
  ],
  reclosers: [
    'Switch.open'
  ],
  synchronousmachines: [
    'RotatingMachine.p',
    'RotatingMachine.q'
  ]
};
