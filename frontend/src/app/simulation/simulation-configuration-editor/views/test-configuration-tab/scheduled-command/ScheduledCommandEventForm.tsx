import * as React from 'react';

import { BasicButton } from '@shared/buttons';
import {
  ModelDictionary,
  ModelDictionaryCapacitor,
  ModelDictionaryComponent,
  ModelDictionaryRegulator,
  ModelDictionarySwitch
} from '@shared/topology/model-dictionary';
import { SCHEDULED_COMMAND_EVENT_ATTRIBUTES } from '../../../models/scheduled-command-event-attribute';
import { Select, Input, SelectionOptionBuilder, FormGroupModel, FormControlModel } from '@shared/form';
import { ScheduledCommandEvent, Phase } from '@shared/test-manager';
import { Validators } from '@shared/form/validation';
// import { ScheduledCommandEventFormService } from '../../../services/ScheduledCommandEventFormService';
// import { Notification } from '@shared/overlay/notification';

import './ScheduledCommandEventForm.light.scss';
import './ScheduledCommandEventForm.dark.scss';
import { unique } from '@shared/misc';

interface Props {
  startDateTime: number;
  stopDateTime: number;
  modelDictionary: ModelDictionary;
  modelDictionaryComponents: ModelDictionaryComponent[];
  onAddEvent: (event: ScheduledCommandEvent) => void;
}

interface State {
  componentTypeOptionBuilder: SelectionOptionBuilder<{ id: string; label: string }>;
  componentOptionBuilder: SelectionOptionBuilder<ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  attributeOptionBuilder: SelectionOptionBuilder<string>;
  phaseOptionBuilder: SelectionOptionBuilder<Phase>;
  selectedComponentType: string;
}

export class ScheduledCommandEventForm extends React.Component<Props, State> {

  readonly selectedComponenTypeFormControl = new FormControlModel<{ id: string; label: string }>(null);
  readonly selectedComponentFormControl: FormControlModel<ModelDictionaryComponent | ModelDictionaryRegulator | ModelDictionaryCapacitor | ModelDictionarySwitch>;
  readonly eventFormGroupModel: FormGroupModel<ScheduledCommandEvent>;

  // private readonly _formService = ScheduledCommandEventFormService.getInstance();

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
      attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      selectedComponentType: ''
    };

    this.selectedComponentFormControl = new FormControlModel(null);
    this.selectedComponentFormControl.dependsOn(this.selectedComponenTypeFormControl);
    this.eventFormGroupModel = this._createFormGroupModelForScheduledCommandEvent();
    this.eventFormGroupModel.findControl('componentName').dependsOn(this.selectedComponentFormControl);
    this.eventFormGroupModel.findControl('attribute').dependsOn(this.selectedComponentFormControl);
    this.eventFormGroupModel.findControl('phases').dependsOn(this.selectedComponentFormControl);

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
      phases: new FormControlModel([]),
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
            /* if (selectedType.label === 'Regulator' || this.state.selectedComponentType === 'Regulator') {
              const newFormControl = new FormControlModel('', [Validators.checkNotEmpty('Attribute')]);

              this.eventFormGroupModel.setControl('attribute', newFormControl);
              newFormControl.dependsOn(this.selectedComponentFormControl);
            }*/
            this.setState({
              componentOptionBuilder: new SelectionOptionBuilder(
                this.props.modelDictionary[selectedType.id] || [],
                e => `${'name' in e ? e.name : e.bankName} (${'phases' in e ? e.phases : e.bankPhases})`
              ),
              attributeOptionBuilder: new SelectionOptionBuilder(
                SCHEDULED_COMMAND_EVENT_ATTRIBUTES[selectedType.id] || []
              ),
              phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              selectedComponentType: selectedType.label
            });
          } else {
            this.setState({
              componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
              phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
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
            const jj = 'conductingEquipmentMRIDs' in selectedComponent
              ? selectedComponent.conductingEquipmentMRIDs
              : selectedComponent.mRID;
            
            // User can select the phase if there is mrid corresponding to each pahse 
            if (Array.isArray(jj) && (jj.length > 1)) {
              this.setState({
                phaseOptionBuilder: new SelectionOptionBuilder(
                  unique(this._normalizePhases('phases' in selectedComponent ? selectedComponent.phases : selectedComponent.bankPhases))
                    .sort((a, b) => a.localeCompare(b))
                    .map((phase, i) => ({ phaseLabel: phase, phaseIndex: i })),
                  phase => phase.phaseLabel
                )
              });
            // Phase selection is disabled if there is only one mrid for all the phases
            // each phase cannot be controlled individually as the component only have one mrid for all the phases
            } else {
              this.setState({
                phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
              });
            }
            const componentName = 'name' in selectedComponent ? selectedComponent.name : selectedComponent.bankName;
            this.eventFormGroupModel.setValue({
              componentName,
              mRID: 'conductingEquipmentMRIDs' in selectedComponent
                ? selectedComponent.conductingEquipmentMRIDs
                : selectedComponent.mRID
            });

            /* if (this.state.selectedComponentType !== 'Regulator') {
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
            this.setState({
              phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });
            this.eventFormGroupModel.setValue({
              componentName: '',
              mRID: ''
            });
            /* this.setState({
              attributeOptionBuilder: SelectionOptionBuilder.defaultBuilder()
            });*/
          }
        }
      });
  }

  private _normalizePhases(phases: string | string[]) {
    if (Array.isArray(phases)) {
      return phases;
    }
    // If phases is a string containing either A or B or C,
    // then this string needs to be split up
    return /^[abc]+$/i.test(phases) ? [...new Set(phases)] : [phases];
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
          label='Phases'
          multiple
          selectionOptionBuilder={this.state.phaseOptionBuilder}
          formControlModel={this.eventFormGroupModel.findControl('phases')} />
        <Select
          optional
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
    this.props.onAddEvent(this.eventFormGroupModel.getValue());
    this.selectedComponentFormControl.reset();
    this.eventFormGroupModel.reset();
    this.setState({
      componentOptionBuilder: SelectionOptionBuilder.defaultBuilder(),
      phaseOptionBuilder: SelectionOptionBuilder.defaultBuilder()
    });
  }

}
