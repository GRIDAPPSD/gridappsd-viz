import * as React from 'react';

import { Dialog, DialogContent, DialogActions } from '@shared/dialog';
import { SelectFormControl, CheckBox, FormControl } from '@shared/form';
import { MenuItem } from '@shared/dropdown-menu';
import { BasicButton } from '@shared/buttons';
import { CapacitorControlMode } from '@shared/CapacitorControlMode';
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
}

export class CapacitorMenu extends React.Component<Props, State> {

  readonly capacitor: Capacitor;

  constructor(props: Props) {
    super(props);
    this.state = {
      controlMode: props.capacitor.controlMode
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
            <SelectFormControl
              label='Control mode'
              menuItems={[
                new MenuItem('Manual', CapacitorControlMode.MANUAL),
                new MenuItem('Var', CapacitorControlMode.VAR),
                new MenuItem('Volt', CapacitorControlMode.VOLT)
              ]}
              defaultSelectedIndex={
                this.state.controlMode === CapacitorControlMode.MANUAL ? 0 :
                  this.state.controlMode === CapacitorControlMode.VAR ? 1 :
                    this.state.controlMode === CapacitorControlMode.VOLT ? 2 :
                      undefined
              }
              onChange={menuItem => {
                this.capacitor.controlMode = menuItem.value;
                this.setState({ controlMode: menuItem.value });
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
          <SelectFormControl
            label='Action'
            menuItems={[
              new MenuItem('Open', true),
              new MenuItem('Close', false),
            ]}
            defaultSelectedIndex={this.capacitor.open ? 0 : 1}
            onChange={menuItem => this.capacitor.open = menuItem.value} />
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
            <FormControl
              label='Target'
              name='target'
              hint='Unit in Var'
              value={this.capacitor.var.target}
              onChange={newValue => this.capacitor.var.target = newValue} />
            <FormControl
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
            <FormControl
              label='Target'
              name='target'
              hint='Unit in Volt'
              value={this.capacitor.volt.target}
              onChange={newValue => this.capacitor.volt.target = newValue} />
            <FormControl
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