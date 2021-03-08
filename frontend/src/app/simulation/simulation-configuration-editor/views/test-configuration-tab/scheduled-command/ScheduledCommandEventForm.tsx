import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import { ModelDictionary, ModelDictionaryCapacitor, ModelDictionaryRegulator, ModelDictionarySwitch } from '@shared/topology/model-dictionary';
import { Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@shared/form';
import { ScheduledCommandEvent } from '@shared/test-manager';
import { Validators } from '@shared/form/validation';
import { ScheduledCommandEventFormService } from '../../../services/ScheduledCommandEventFormService';
import { Notification } from '@shared/overlay/notification';

import './ScheduledCommandEventForm.light.scss';
import './ScheduledCommandEventForm.dark.scss';

interface Props {
  startDateTime: number;
  stopDateTime: number;
  modelDictionary: ModelDictionary;
  onAddEvent: (event: ScheduledCommandEvent) => void;
}

interface State {
  componentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  componentOptionBuilder: SelectionOptionBuilder<ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  attributeOptionBuilder: SelectionOptionBuilder<string>;
}

export class ScheduledCommandEventForm extends React.Component<Props, State> {

  readonly selectedComponenTypeFormControl = new FormControlModel<{ id: string; label: string }>(null);
  readonly selectedComponentFormControl: FormControlModel<ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  readonly eventFormGroupModel: FormGroupModel<ScheduledCommandEvent>;

  private readonly formService = ScheduledCommandEventFormService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      componentTypeOptionBuilder: new SelectionOptionBuilder(
        [
          { label: 'Battery', id: 'batteries' },
          { label: 'Breaker', id: 'breakers' },
          { label: 'Capacitor', id: 'capacitors' },
          { label: 'Disconnector', id: 'disconnectors' },
          { label: 'Fuse', id: 'fuses' },
          { label: 'Recloser', id: 'reclosers' },
          { label: 'Regulator', id: 'regulators' },
          { label: 'Sectionaliser', id: 'sectionalisers' },
          { label: 'Solar Panel', id: 'solarpanels' },
          { label: 'Switch', id: 'switches' },
          { label: 'Synchronous Machine', id: 'synchronousmachines' }
        ],
        type => type.label
      ),
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    };

    this.selectedComponentFormControl = new FormControlModel(null);
    this.selectedComponentFormControl.dependsOn(this.selectedComponenTypeFormControl);
    this.eventFormGroupModel = this._createFormGroupModelForScheduledCommandEvent();
    this.eventFormGroupModel.findControl('componentName').dependsOn(this.selectedComponentFormControl);

    this.createNewEvent = this.createNewEvent.bind(this);
  }

  private _createFormGroupModelForScheduledCommandEvent() {
    return new FormGroupModel<ScheduledCommandEvent>({
      eventType: 'ScheduledCommandEvent',
      tag: '',
      componentName: '',
      attribute: new FormControlModel(''),
      forwardDifferenceValue: new FormControlModel(0, [Validators.checkNotEmpty('Value'), Validators.checkValidNumber('Value')]),
      reverseDifferenceValue: new FormControlModel(0, [Validators.checkNotEmpty('Value'), Validators.checkValidNumber('Value')]),
      mRID: null,
      startDateTime: new FormControlModel(
        this.props.startDateTime,
        [Validators.checkNotEmpty('Start date time'), Validators.checkValidDateTime('Start date time')]
      ),
      stopDateTime: new FormControlModel(
        this.props.stopDateTime,
        [Validators.checkNotEmpty('Stop date time'), Validators.checkValidDateTime('Stop date time')]
      )
    });
  }

  componentDidMount() {
    this.eventFormGroupModel.validityChanges()
      .subscribe({
        next: () => this.forceUpdate()
      });
    this._populateComponentSelectionOnEquipmentTypeChanges();
    this._processComponentSelectionChanges();
  }

  private _populateComponentSelectionOnEquipmentTypeChanges() {
    this.selectedComponenTypeFormControl.valueChanges()
      .subscribe({
        next: selectedType => {
          if (selectedType) {
            this.setState({
              componentOptionBuilder: new SelectionOptionBuilder(
                this.props.modelDictionary[selectedType.id] || [],
                e => 'name' in e ? e.name : e.bankName
              ),
            });
          } else {
            this.setState({
              componentOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  private _processComponentSelectionChanges() {
    this.selectedComponentFormControl.valueChanges()
      .subscribe({
        next: selectedComponent => {
          if (selectedComponent) {
            const componentName = 'name' in selectedComponent ? selectedComponent.name : selectedComponent.bankName;
            this.eventFormGroupModel.setValue({
              componentName,
              mRID: selectedComponent.mRID
            });

            const objectId = typeof selectedComponent.mRID === 'string' ? selectedComponent.mRID : selectedComponent.mRID[0];
            this.formService.fetchAttributes(objectId, this.props.modelDictionary.mRID)
              .then(attributes => {
                if (attributes.length === 0) {
                  Notification.open(
                    <>
                      <span>Attribute list is empty for&nbsp;</span>
                      <strong style={{ color: '#ffa500' }}>{componentName}</strong>
                    </>
                  );
                }
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(attributes)
                });
              })
              .catch(reason => Notification.open(reason));
          } else {
            this.eventFormGroupModel.setValue({
              componentName: '',
              mRID: ''
            });
            this.setState({
              attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
          }
        }
      });
  }

  componentWillUnmount() {
    this.selectedComponenTypeFormControl.cleanup();
    this.selectedComponentFormControl.cleanup();
    this.eventFormGroupModel.cleanup();
  }

  render() {
    return (
      <div className='scheduled-event'>
        <Select
          label='Component type'
          selectionOptionBuilder={this.state.componentTypeOptionBuilder}
          formControlModel={this.selectedComponenTypeFormControl} />
        <Select
          label='Component'
          selectionOptionBuilder={this.state.componentOptionBuilder}
          formControlModel={this.selectedComponentFormControl} />
        <Select
          label='Attribute'
          selectionOptionBuilder={this.state.attributeOptionBuilder}
          formControlModel={this.eventFormGroupModel.findControl('attribute')} />
        <Input
          label='Reverse difference value'
          formControlModel={this.eventFormGroupModel.findControl('reverseDifferenceValue')}
          type='number' />
        <Input
          label='Forward difference value'
          formControlModel={this.eventFormGroupModel.findControl('forwardDifferenceValue')}
          type='number' />
        <Input
          label='Start date time'
          formControlModel={this.eventFormGroupModel.findControl('startDateTime')}
          hint='YYYY-MM-DD HH:MM:SS'
          type='datetime' />
        <Input
          label='Stop date time'
          hint='YYYY-MM-DD HH:MM:SS'
          formControlModel={this.eventFormGroupModel.findControl('stopDateTime')}
          type='datetime' />
        <BasicButton
          className='scheduled-event-form__add-event'
          disabled={this.eventFormGroupModel.isInvalid()}
          type='positive'
          label='Add event'
          onClick={this.createNewEvent} />
      </div>
    );
  }

  createNewEvent() {
    const formValue = this.eventFormGroupModel.getValue();
    this.props.onAddEvent(formValue);
    this.selectedComponentFormControl.reset();
    this.eventFormGroupModel.reset();
    this.setState({
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
  }

}
