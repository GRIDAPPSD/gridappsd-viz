import { Component } from 'react';

import { Dialog, DialogContent, DialogActionGroup } from '@client:common/overlay/dialog';
import { Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@client:common/form';
import { BasicButton } from '@client:common/buttons';
import { Validators } from '@client:common/form/validation';
import { Regulator } from '@client:common/topology';
import { RegulatorControlMode } from '@client:common/topology/RegulatorControlMode';

import './RegulatorControlMenu.light.scss';
import './RegulatorControlMenu.dark.scss';

interface Props {
  left: number;
  top: number;
  regulator: Regulator;
  onSubmit: (updatedRegulator: Regulator) => void;
  onAfterClosed: () => void;
}

interface State {
  show: boolean;
  controlMode: RegulatorControlMode;
  controlModelOptionBuilder: SelectionOptionBuilder<RegulatorControlMode>;
  disableApplyButton: boolean;
}

export class RegulatorControlMenu extends Component<Props, State> {

  readonly regulatorControlMenuFormGroupModel: FormGroupModel<Regulator>;

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
      ),
      disableApplyButton: true
    };

    this.regulatorControlMenuFormGroupModel = this._setupRegulatorControlMenuFormGroupModel();

    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  private _setupRegulatorControlMenuFormGroupModel() {
    return new FormGroupModel<Regulator>({
      ...this.props.regulator,
      controlMode: new FormControlModel(this.props.regulator.controlMode),
      manual: new FormControlModel(this.props.regulator.manual),
      phaseValues: this._createFormGroupModelForPhaseValueControls(this.props.regulator.controlMode)
    });
  }

  private _createFormGroupModelForPhaseValueControls(controlMode: RegulatorControlMode) {
    switch (controlMode) {
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        return this._addFormGroupModelForLineDropCompensationControlMode();
      case RegulatorControlMode.MANUAL:
        return this._addFormGroupModelForManualControlMode();
    }
    return null;
  }

  private _addFormGroupModelForLineDropCompensationControlMode() {
    const formGroupModel = new FormGroupModel<Regulator['phaseValues']>();
    for (const phase of this.props.regulator.phases) {
      const { lineDropR, lineDropX, tap } = this.props.regulator.phaseValues?.[phase] || { lineDropR: 0, lineDropX: 0, tap: 0 };
      formGroupModel.setControl(
        phase,
        new FormGroupModel({
          lineDropR: new FormControlModel(lineDropR, this._getValidators('LineDropR')),
          lineDropX: new FormControlModel(lineDropX, this._getValidators('lineDropX')),
          tap
        })
      );
    }
    return formGroupModel;
  }

  private _getValidators(controlDisplayName: string) {
    return [
      Validators.checkNotEmpty(controlDisplayName),
      Validators.checkValidNumber(controlDisplayName)
    ];
  }

  private _addFormGroupModelForManualControlMode() {
    const formGroupModel = new FormGroupModel<Regulator['phaseValues']>();
    for (const phase of this.props.regulator.phases) {
      const { lineDropR, lineDropX, tap } = this.props.regulator.phaseValues?.[phase] || { lineDropR: 0, lineDropX: 0, tap: 0 };
      formGroupModel.setControl(
        phase,
        new FormGroupModel({
          lineDropR,
          lineDropX,
          tap: new FormControlModel(tap, this._getValidators(`Tap ${phase}`))
        })
      );
    }
    return formGroupModel;
  }

  componentDidMount() {
    this.regulatorControlMenuFormGroupModel.findControl('controlMode')
      .valueChanges()
      .subscribe({
        next: controlMode => {
          if (controlMode !== this.state.controlMode) {
            this.regulatorControlMenuFormGroupModel.setControl(
              'phaseValues',
              this._createFormGroupModelForPhaseValueControls(controlMode)
            );

            this.regulatorControlMenuFormGroupModel.findControl('manual')
              .setValue(controlMode === RegulatorControlMode.MANUAL);

            this.setState({
              controlMode
            });
          }
        }
      });


    this.regulatorControlMenuFormGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableApplyButton: !isValid || this.regulatorControlMenuFormGroupModel.isPristine()
          });
        }
      });
  }

  componentWillUnmount() {
    this.regulatorControlMenuFormGroupModel.cleanup();
  }

  render() {
    return (
      <Dialog
        className='regulator-control-menu'
        open={this.state.show}
        top={this.props.top}
        left={this.props.left}
        onAfterClosed={this.props.onAfterClosed}>
        <DialogContent style={{ overflow: 'hidden' }}>
          <form className='regulator-control-menu__form'>
            <Select
              label='Control mode'
              selectionOptionBuilder={this.state.controlModelOptionBuilder}
              selectedOptionFinder={mode => mode === this.state.controlMode}
              formControlModel={this.regulatorControlMenuFormGroupModel.findControl('controlMode')} />
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
            disabled={this.state.disableApplyButton}
            onClick={this.onSubmit} />
        </DialogActionGroup>
      </Dialog>
    );
  }

  showFormFieldsBasedOnControlMode() {
    // The sort method below will modify the phases array
    // and if the phases are not sorted by default
    // then mRID array elements will not map to their respective phase,
    // so we need to copy the phases array before sorting
    const phases = [...this.props.regulator.phases].sort((a, b) => a.localeCompare(b));
    switch (this.state.controlMode) {
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        return (
          <ul>
            {
              phases.map(phase => (
                <li
                  key={phase}
                  className='regulator-control-menu__form__section'>
                  <span>{`Phase ${phase}`}</span>
                  <ul>
                    <li>
                      <Input
                        label='LineDropR'
                        hint='Unit in Ohms'
                        type='number'
                        formControlModel={
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          this.regulatorControlMenuFormGroupModel.findControl(`phaseValues.${phase}.lineDropR` as any)
                        } />
                    </li>
                    <li>
                      <Input
                        label='LineDropX'
                        hint='Unit in Ohms'
                        type='number'
                        formControlModel={
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          this.regulatorControlMenuFormGroupModel.findControl(`phaseValues.${phase}.lineDropX` as any)
                        } />
                    </li>
                  </ul>
                </li>
              ))
            }
          </ul>
        );
      case RegulatorControlMode.MANUAL:
        return (
          phases.map(phase => (
            <Input
              key={phase}
              label={`Tap ${phase}`}
              type='number'
              formControlModel={
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.regulatorControlMenuFormGroupModel.findControl(`phaseValues.${phase}.tap` as any)
              } />
          ))
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
    this.props.onSubmit(this.regulatorControlMenuFormGroupModel.getValue());
    this.setState({
      show: false
    });
  }

}
