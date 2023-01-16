import { Component } from 'react';

import { BasicButton } from '@client:common/buttons';
import { Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@client:common/form';
import { ScheduledCommandEvent } from '@client:common/test-manager';
import { Validators } from '@client:common/form/validation';
import {
  ModelDictionary,
  ModelDictionaryCapacitor,
  ModelDictionaryComponent,
  ModelDictionaryRegulator,
  ModelDictionarySwitch
} from '@client:common/topology/model-dictionary';

import { ScheduledCommandEventFormService } from '../../../services/ScheduledCommandEventFormService';
import { COMPONENT_ATTRIBUTES } from '../../../models/component-attributes';

import './ScheduledCommandEventForm.light.scss';
import './ScheduledCommandEventForm.dark.scss';

interface Props {
  startDateTime: number;
  stopDateTime: number;
  modelDictionary: ModelDictionary;
  modelDictionaryComponents: ModelDictionaryComponent[];
  onAddEvent: (event: ScheduledCommandEvent) => void;
}

interface State {
  componentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  componentOptionBuilder: SelectionOptionBuilder<ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  attributeOptionBuilder: SelectionOptionBuilder<string>;
  selectedComponentType: string;
}

export class ScheduledCommandEventForm extends Component<Props, State> {

  readonly selectedComponenTypeFormControl = new FormControlModel<{ id: string; label: string }>(null);
  readonly selectedComponentFormControl: FormControlModel<ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  readonly eventFormGroupModel: FormGroupModel<ScheduledCommandEvent>;

  private readonly _formService = ScheduledCommandEventFormService.getInstance();

  constructor(props: Props) {
    super(props);

    const labels = [];
    if (this.props.modelDictionary.capacitors.length > 0) {
      labels.push({label: 'Capacitor', id: 'capacitors'});
    }
    if (this.props.modelDictionary.disconnectors.length > 0) {
      labels.push({label: 'Disconnector', id: 'disconnectors'});
    }
    if (this.props.modelDictionary.switches.length > 0) {
      labels.push({label: 'Switch', id: 'switches'});
    }
    if (this.props.modelDictionary.batteries.length > 0) {
      labels.push({label: 'Battery', id: 'batteries'});
    }
    if (this.props.modelDictionary.breakers.length > 0) {
      labels.push({label: 'Breaker', id: 'breakers'});
    }
    if (this.props.modelDictionary.fuses.length > 0) {
      labels.push({label: 'Fuse', id: 'fuses'});
    }
    if (this.props.modelDictionary.reclosers.length > 0) {
      labels.push({label: 'Recloser', id: 'reclosers'});
    }
    if (this.props.modelDictionary.regulators.length > 0) {
      labels.push({label: 'Regulator', id: 'regulators'});
    }
    if (this.props.modelDictionary.sectionalisers.length > 0) {
      labels.push({label: 'Sectionaliser', id: 'sectionalisers'});
    }
    if (this.props.modelDictionary.solarpanels.length > 0) {
      labels.push({label: 'Solar PV', id: 'solarpanels'});
    }
    if (this.props.modelDictionary.synchronousmachines.length > 0) {
      labels.push({label: 'Synchronous Machine', id: 'synchronousmachines'});
    }
    this.state = {
      componentTypeOptionBuilder: new SelectionOptionBuilder(labels,type => type.label),
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      selectedComponentType: ''
    };

    this.selectedComponentFormControl = new FormControlModel(null);
    this.selectedComponentFormControl.dependsOn(this.selectedComponenTypeFormControl);
    this.eventFormGroupModel = this._createFormGroupModelForScheduledCommandEvent();
    this.eventFormGroupModel.findControl('componentName').dependsOn(this.selectedComponentFormControl);
    this.eventFormGroupModel.findControl('attribute').dependsOn(this.selectedComponentFormControl);

    this.createNewEvent = this.createNewEvent.bind(this);
  }

  private _createFormGroupModelForScheduledCommandEvent() {
    return new FormGroupModel<ScheduledCommandEvent>({
      eventType: 'ScheduledCommandEvent',
      tag: '',
      componentName: '',
      attribute: new FormControlModel('', [Validators.checkNotEmpty('Attribute')]),
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
            /*
              If the new selected type is Regulator or the previous one was Regulator,
              we want to add a new `FormControlModel` for the attribute
            */
            if (selectedType.label === 'Regulator' || this.state.selectedComponentType === 'Regulator') {
              const newFormControl = new FormControlModel('', [Validators.checkNotEmpty('Attribute')]);

              this.eventFormGroupModel.setControl('attribute', newFormControl);
              newFormControl.dependsOn(this.selectedComponentFormControl);
            }
            this.setState({
              componentOptionBuilder: new SelectionOptionBuilder(
                this.props.modelDictionary[selectedType.id] || [],
                e => 'name' in e ? e.name : e.bankName
              ),
              selectedComponentType: selectedType.label
            });
          } else {
            this.setState({
              componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              selectedComponentType: ''
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
            // Display attributes based on COMPONENT_ATTRIBUTES file
            switch (this.state.selectedComponentType) {
              case 'Synchronous Machine':
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(
                    COMPONENT_ATTRIBUTES['synchronousmachines']
                  )
                });
                break;
              case 'Capacitor':
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(
                    COMPONENT_ATTRIBUTES['capacitors']
                  )
                });
                break;
              case 'Switch':
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(
                    COMPONENT_ATTRIBUTES['switches']
                  )
                });
                break;
              case 'Solar PV':
              case 'Battery':
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(
                    COMPONENT_ATTRIBUTES['der']
                  )
                });
                break;
              case 'Regulator':
                this.setState({
                  attributeOptionBuilder: new SelectionOptionBuilder(
                    COMPONENT_ATTRIBUTES['regulators']
                  )
                });
                break;
              default:
                this.setState({
                  attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
                });
            }

            // Fetch attributes from platform
            /* if (this.state.selectedComponentType === 'Synchronous Machine') {
              this.setState({
                attributeOptionBuilder: new SelectionOptionBuilder(
                  COMPONENT_ATTRIBUTES['synchronousmachines']
                )
              });
            } else if (this.state.selectedComponentType !== 'Regulator') {
              this._formService.fetchAttributes(
                typeof selectedComponent.mRID === 'string' ? selectedComponent.mRID : selectedComponent.mRID[0],
                this.props.modelDictionary.mRID,
                'LinearShuntCompensator'
              ).then(attributes => {
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
                .catch(reason => {
                  if (reason) {
                    Notification.open(reason);
                  }
                });
            }*/
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
       {
          this.state.selectedComponentType !== 'Regulator'
            ? (
              <Select
                optional
                label='Attribute'
                selectionOptionBuilder={this.state.attributeOptionBuilder}
                formControlModel={this.eventFormGroupModel.findControl('attribute')} />
            ) : (
              <Input
                label='Attribute'
                formControlModel={this.eventFormGroupModel.findControl('attribute')} />
            )
        }
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
    this.props.onAddEvent(this.eventFormGroupModel.getValue());
    this.selectedComponentFormControl.reset();
    this.eventFormGroupModel.reset();
  }

}
