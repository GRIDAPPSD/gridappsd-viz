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
  show: boolean;
  controlMode: CapacitorControlMode;
  options: Option<CapacitorControlMode>[];
}

export class CapacitorMenu extends React.Component<Props, State> {

  readonly capacitor: Capacitor;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      controlMode: props.capacitor.controlMode,
      options: [
        new Option('Manual', CapacitorControlMode.MANUAL),
        new Option('Var', CapacitorControlMode.VAR),
        new Option('Volt', CapacitorControlMode.VOLT)
      ]
    };

    this.capacitor = { ...props.capacitor };

    this.onCancel = this.onCancel.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
  }

  render() {
    return (
      <Dialog
        className='capacitor-menu'
        show={this.state.show}
        top={this.props.top}
        left={this.props.left}>
        <DialogContent styles={{ overflow: 'hidden' }}>
          <form className='capacitor-menu__form'>
            <Select
              multiple={false}
              label='Control mode'
              options={this.state.options}
              isOptionSelected={option => option.value === this.state.controlMode}
              onChange={selectedOption => {
                this.capacitor.controlMode = selectedOption.value;
                this.setState({ controlMode: this.capacitor.controlMode });
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
    switch (this.state.controlMode) {
      case CapacitorControlMode.MANUAL:
        return (
          <Select
            multiple={false}
            label='Action'
            options={[
              new Option('Open', true),
              new Option('Close', false),
            ]}
            isOptionSelected={option => option.value === this.capacitor.open}
            onChange={selectedOption => this.capacitor.open = selectedOption.value} />
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

  onCancel() {
    this.setState({
      show: false
    }, this.props.onCancel);
  }

  onConfirm() {
    this.setState({
      show: false
    }, () => this.props.onConfirm(this.capacitor));
  }

}
