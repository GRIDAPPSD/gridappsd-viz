import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { Select, Input, Option } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { CapacitorControlMode } from '@shared/topology/CapacitorControlMode';
import { Capacitor } from '@shared/topology';

import './CapacitorMenu.scss';

interface Props {
  onConfirm: (capacitor: Capacitor) => void;
  onCancel: () => void;
  capacitor: Capacitor;
  left: number;
  top: number;
}

interface State {
  controlMode: CapacitorControlMode;
  options: Option<CapacitorControlMode>[];
}

export class CapacitorMenu extends React.Component<Props, State> {

  readonly capacitor: Capacitor;

  constructor(props: Props) {
    super(props);
    this.state = {
      controlMode: props.capacitor.controlMode,
      options: [
        new Option('Manual', CapacitorControlMode.MANUAL),
        new Option('Var', CapacitorControlMode.VAR),
        new Option('Volt', CapacitorControlMode.VOLT)
      ]
    };

    this.capacitor = { ...props.capacitor };
  }

  render() {
    return (
      <Dialog
        className='capacitor-menu'
        show={true}
        styles={{ left: this.props.left + 'px', top: this.props.top + 'px' }}>
        <DialogContent styles={{ overflow: 'hidden' }}>
          <form className='capacitor-menu__form'>
            <Select
              label='Control mode'
              options={this.state.options}
              isOptionSelected={option => option.value === this.state.controlMode}
              onChange={options => {
                this.capacitor.controlMode = options[0].value;
                this.setState({ controlMode: this.capacitor.controlMode });
              }} />
            {this.showFormFieldsBasedOnControlMode()}
          </form>
        </DialogContent>
        <DialogActions>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.props.onCancel} />
          <BasicButton
            type='positive'
            label='Apply'
            onClick={() => this.props.onConfirm(this.capacitor)} />
        </DialogActions>
      </Dialog>
    );
  }

  showFormFieldsBasedOnControlMode() {
    switch (this.state.controlMode) {
      case CapacitorControlMode.MANUAL:
        return (
          <Select
            label='Action'
            options={[
              new Option('Open', true),
              new Option('Close', false),
            ]}
            isOptionSelected={option => option.value === this.capacitor.open}
            onChange={options => this.capacitor.open = options[0].value} />
        );
      case CapacitorControlMode.VAR:
        if (this.props.capacitor.var)
          this.capacitor.var = {
            target: this.props.capacitor.var.target,
            deadband: this.props.capacitor.var.deadband
          };
        else
          this.capacitor.var = {
            target: '',
            deadband: ''
          };
        return (
          <>
            <Input
              label='Target'
              name='target'
              hint='Unit in Var'
              value={this.capacitor.var.target}
              onChange={newValue => this.capacitor.var.target = newValue} />
            <Input
              label='Deadband'
              name='Deadband'
              hint='Unit in Var'
              value={this.capacitor.var.deadband}
              onChange={newValue => this.capacitor.var.deadband = newValue} />
          </>
        );
      case CapacitorControlMode.VOLT:
        if (this.props.capacitor.volt)
          this.capacitor.volt = {
            target: this.props.capacitor.volt.target,
            deadband: this.props.capacitor.volt.deadband
          };
        else
          this.capacitor.volt = {
            target: '',
            deadband: ''
          };
        return (
          <>
            <Input
              label='Target'
              name='target'
              hint='Unit in Volt'
              value={this.capacitor.volt.target}
              onChange={newValue => this.capacitor.volt.target = newValue} />
            <Input
              label='Deadband'
              name='Deadband'
              hint='Unit in Volt'
              value={this.capacitor.volt.deadband}
              onChange={newValue => this.capacitor.volt.deadband = newValue} />
          </>
        );
    }
    return null;
  }

}