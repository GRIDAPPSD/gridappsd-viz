import { Component } from 'react';

import { Dialog, DialogContent, DialogActionGroup } from '@client:common/overlay/dialog';
import { Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@client:common/form';
import { BasicButton } from '@client:common/buttons';
import { Validators } from '@client:common/form/validation';
import { Capacitor } from '@client:common/topology';
import { CapacitorControlMode } from '@client:common/topology/CapacitorControlMode';

import './CapacitorControlMenu.light.scss';
import './CapacitorControlMenu.dark.scss';

interface Props {
  capacitor: Capacitor;
  left: number;
  top: number;
  onSubmit: (capacitor: Capacitor) => void;
  onAfterClosed: () => void;
}

interface State {
  show: boolean;
  controlMode: CapacitorControlMode;
  controlModeOptionBuilder: SelectionOptionBuilder<CapacitorControlMode>;
  actionOptionBuilder: SelectionOptionBuilder<boolean>;
  disableSubmitButton: boolean;
}

export class CapacitorControlMenu extends Component<Props, State> {

  readonly capacitorControlFormGroupModel: FormGroupModel<Capacitor>;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: true,
      controlMode: props.capacitor.controlMode,
      controlModeOptionBuilder: new SelectionOptionBuilder(
        [
          CapacitorControlMode.MANUAL,
          CapacitorControlMode.VAR,
          CapacitorControlMode.VOLT
        ],
        controlMode => {
          switch (controlMode) {
            case CapacitorControlMode.MANUAL:
              return 'Manual';
            case CapacitorControlMode.VAR:
              return 'Var';
            case CapacitorControlMode.VOLT:
              return 'Volt';
            default:
              return '';
          }
        }
      ),
      actionOptionBuilder: new SelectionOptionBuilder([true, false], open => open ? 'Open' : 'Close'),
      disableSubmitButton: true
    };

    this.capacitorControlFormGroupModel = this._setupCapacitorControlMenuFormGroupModel();

    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  private _setupCapacitorControlMenuFormGroupModel() {
    const targetFormControl = new FormControlModel(
      0,
      [
        Validators.checkNotEmpty('Target value'),
        Validators.checkValidNumber('Target value')
      ]
    );
    const deadbandFormControl = new FormControlModel(
      0,
      [
        Validators.checkNotEmpty('Deadband value'),
        Validators.checkValidNumber('Deadband value')
      ]
    );
    if (this.props.capacitor.controlMode === CapacitorControlMode.VAR) {
      if (this.props.capacitor.var) {
        targetFormControl.setValue(this.props.capacitor.var.target);
        deadbandFormControl.setValue(this.props.capacitor.var.deadband);
      }
    } else if (this.props.capacitor.controlMode === CapacitorControlMode.VOLT) {
      if (this.props.capacitor.volt) {
        targetFormControl.setValue(this.props.capacitor.volt.target);
        deadbandFormControl.setValue(this.props.capacitor.volt.deadband);
      }
    }
    return new FormGroupModel<Capacitor>({
      ...this.props.capacitor,
      open: new FormControlModel(this.props.capacitor.open),
      controlMode: new FormControlModel(this.props.capacitor.controlMode),
      manual: this.props.capacitor.manual,
      var: new FormGroupModel({
        target: targetFormControl,
        deadband: deadbandFormControl
      }),
      volt: new FormGroupModel({
        target: targetFormControl,
        deadband: deadbandFormControl
      })
    });
  }

  componentDidMount() {
    this.capacitorControlFormGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid || this.capacitorControlFormGroupModel.isPristine()
          });
        }
      });

    this.capacitorControlFormGroupModel.findControl('controlMode')
      .valueChanges()
      .subscribe({
        next: controlMode => {
          if (controlMode !== this.state.controlMode) {
            if (controlMode === CapacitorControlMode.VAR) {
              this.capacitorControlFormGroupModel.setValue({
                var: this.props.capacitor.var || { target: 0, deadband: 0 }
              });
            } else if (controlMode === CapacitorControlMode.VOLT) {
              this.capacitorControlFormGroupModel.setValue({
                volt: this.props.capacitor.volt || { target: 0, deadband: 0 }
              });
            }
            this.capacitorControlFormGroupModel.setValue({
              manual: controlMode === CapacitorControlMode.MANUAL
            });
            this.setState({
              controlMode
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.capacitorControlFormGroupModel.cleanup();
  }

  render() {
    return (
      <Dialog
        className='capacitor-control-menu'
        open={this.state.show}
        top={this.props.top}
        left={this.props.left}
        onAfterClosed={this.props.onAfterClosed}>
        <DialogContent style={{ overflow: 'hidden' }}>
          <form className='capacitor-control-menu__form'>
            <Select
              label='Control mode'
              selectionOptionBuilder={this.state.controlModeOptionBuilder}
              selectedOptionFinder={mode => mode === this.state.controlMode}
              formControlModel={this.capacitorControlFormGroupModel.findControl('controlMode')} />
            {this.showFormFieldsBasedOnControlMode()}
          </form>
        </DialogContent>
        <DialogActionGroup>
          <BasicButton
            type='negative'
            label='Cancel'
            onClick={this.onClose} />
          <BasicButton
            type='positive'
            label='Apply'
            disabled={this.state.disableSubmitButton}
            onClick={this.onSubmit} />
        </DialogActionGroup>
      </Dialog>
    );
  }

  showFormFieldsBasedOnControlMode() {
    switch (this.state.controlMode) {
      case CapacitorControlMode.MANUAL:
        return (
          <Select
            label='Action'
            selectionOptionBuilder={this.state.actionOptionBuilder}
            selectedOptionFinder={action => action === this.props.capacitor.open}
            formControlModel={this.capacitorControlFormGroupModel.findControl('open')} />
        );
      case CapacitorControlMode.VAR:
        return (
          <>
            <Input
              label='Target'
              hint='Unit in Var'
              type='number'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formControlModel={this.capacitorControlFormGroupModel.findControl('var.target' as any)} />
            <Input
              label='Deadband'
              hint='Unit in Var'
              type='number'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formControlModel={this.capacitorControlFormGroupModel.findControl('var.deadband' as any)} />
          </>
        );
      case CapacitorControlMode.VOLT:
        return (
          <>
            <Input
              label='Target'
              hint='Unit in Volt'
              type='number'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formControlModel={this.capacitorControlFormGroupModel.findControl('volt.target' as any)} />
            <Input
              label='Deadband'
              hint='Unit in Volt'
              type='number'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formControlModel={this.capacitorControlFormGroupModel.findControl('volt.deadband' as any)} />
          </>
        );
    }
    return null;
  }

  onClose() {
    this.setState({
      show: false
    });
  }

  onSubmit() {
    this.props.onSubmit(this.capacitorControlFormGroupModel.getValue());
    this.setState({
      show: false
    });
  }

}
