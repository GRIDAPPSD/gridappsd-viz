export const COMPONENT_ATTRIBUTES = {
  capacitors: [
    'RegulatingControl.mode',
    'RegulatingControl.targetDeadband',
    'RegulatingControl.targetValue',
    'ShuntCompensator.aVRDelay',
    'ShuntCompensator.sections'
  ],
  regulators: [
    'RegulatingControl.targetDeadband',
    'RegulatingControl.targetValue',
    'TapChanger.initialDelay',
    'TapChanger.step',
    'TapChanger.lineDropCompensation',
    'TapChanger.lineDropR',
    'TapChanger.lineDropX'
  ],
  inverters: [
    'PowerElectronicsConnection.p',
    'PowerElectronicsConnection.q'
  ],
  switches: [
    'Switch.open'
  ]
};
