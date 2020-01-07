import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { Select, Input, SelectionOptionBuilder } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { RegulatorControlMode } from '@shared/topology/RegulatorControlMode';
import { Regulator } from '@shared/topology';

import './RegulatorMenu.light.scss';
import './RegulatorMenu.dark.scss';

interface Props {
  onConfirm: (newRegulator: Regulator) => void;
  onCancel: () => void;
  left: number;
  top: number;
  regulator: Regulator;
}

interface State {
  show: boolean;
  controlMode: RegulatorControlMode;
  controlModelOptionBuilder: SelectionOptionBuilder<RegulatorControlMode>;
}

export class RegulatorMenu extends React.Component<Props, State> {

  readonly regulator: Regulator;

  constructor(props: Props) {
    super(props);

    this.state = {
      show: true,
      controlMode: props.regulator.controlMode,
      controlModelOptionBuilder: new SelectionOptionBuilder(
        [
          RegulatorControlMode.MANUAL,
          RegulatorControlMode.LINE_DROP_COMPENSATION
        ],
        mode => mode === RegulatorControlMode.MANUAL ? 'Manual' : 'Line drop compensation'
      )
    };

    this.regulator = {
      ...props.regulator
    };
    for (const phase of this.regulator.phases)
      if (!this.regulator.phaseValues[phase])
        this.regulator.phaseValues[phase] = {
          lineDropR: 0,
          lineDropX: 0,
          tap: 0
        };

    this.onCancel = this.onCancel.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  render() {
    return (
      <Dialog
        className='regulator-menu'
        show={this.state.show}
        top={this.props.top}
        left={this.props.left}>
        <DialogContent style={{ overflow: 'hidden' }}>
          <form className='regulator-menu__form'>
            <Select
              label='Control mode'
              selectionOptionBuilder={this.state.controlModelOptionBuilder}
              selectedOptionFinder={mode => mode === this.state.controlMode}
              onChange={selectedControlMode => {
                this.regulator.controlMode = selectedControlMode;
                this.regulator.manual = selectedControlMode === RegulatorControlMode.MANUAL;
                this.setState({
                  controlMode: selectedControlMode
                });
              }} />
            {this.showFormFieldsBasedOnControlMode()}
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.onCancel} />
          <BasicButton
            type='positive'
            label='Apply'
            onClick={this.onConfirm} />
        </DialogActions>
      </Dialog>
    );
  }

  showFormFieldsBasedOnControlMode() {
    // The sort method below will modify the phases array
    // and if the phases are not sorted by default
    // then mRID array elements will not map to their respective phase
    const phases = [...this.regulator.phases];
    switch (this.regulator.controlMode) {
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        return (
          <ul>
            {
              phases.sort((a, b) => a.localeCompare(b))
                .map(phase => (
                  <li key={phase}>
                    <span>{`Phase ${phase}`}</span>
                    <ul>
                      <li>
                        <Input
                          label='LineDropR'
                          name='LineDropR'
                          hint='Unit in Ohms'
                          value={String(this.regulator.phaseValues[phase].lineDropR)}
                          onChange={newValue => this.regulator.phaseValues[phase].lineDropR = +newValue || 0} />
                      </li>
                      <li>
                        <Input
                          label='LineDropX'
                          name='LineDropX'
                          hint='Unit in Ohms'
                          value={String(this.regulator.phaseValues[phase].lineDropX)}
                          onChange={newValue => this.regulator.phaseValues[phase].lineDropX = +newValue || 0} />
                      </li>
                    </ul>
                  </li>
                ))
            }
          </ul>
        );
      case RegulatorControlMode.MANUAL:
        return (
          phases.sort((a, b) => a.localeCompare(b))
            .map(phase => (
              <Input
                key={phase}
                label={`Tap ${phase}`}
                name={`Tap${phase}`}
                value={String(this.regulator.phaseValues[phase].tap)}
                onChange={newValue => this.regulator.phaseValues[phase].tap = +newValue || 0} />
            ))
        );
    }
    return null;
  }

  onCancel() {
    this.setState({
      show: false
    }, this.props.onCancel);
  }

  onConfirm() {
    this.props.onConfirm(this.regulator);
    this.setState({
      show: false
    });
  }

}
