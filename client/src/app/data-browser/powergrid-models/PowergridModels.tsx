/* eslint-disable @typescript-eslint/indent */
import { Component } from 'react';

import { TextArea, Select, SelectionOptionBuilder, FormGroupModel, FormControlModel, Form } from '@client:common/form';
import { BasicButton } from '@client:common/buttons';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { FeederModelLine } from '@client:common/topology';
import { Validators } from '@client:common/form/validation';

import { RequestEditor, Response } from '../DataBrowser';

import {
  QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat
} from './models/QueryPowerGridModelsRequest';

import './PowergridModels.light.scss';
import './PowergridModels.dark.scss';

interface Props {
  feederModelLines: FeederModelLine[];
  response: string;
  isResponseReady: boolean;
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
}

interface State {
  lineOptionBuilder: SelectionOptionBuilder<FeederModelLine>;
  requestTypeOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsRequestType>;
  resultFormatOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsResultFormat>;
  selectedRequestType: QueryPowerGridModelsRequestType;
  disableSubmitButton: boolean;
}

export class PowerGridModels extends Component<Props, State> {

  readonly formGroupModel = new FormGroupModel({
    requestType: new FormControlModel<QueryPowerGridModelsRequestType>(null),
    queryString: new FormControlModel(`
      |SELECT ?feeder ?fid
      |WHERE {
      |   ?s r:type c:Feeder .
      |   ?s c:IdentifiedObject.name ?feeder .
      |   ?s c:IdentifiedObject.mRID ?fid .
      |   ?s c:Feeder.NormalEnergizingSubstation ?sub .
      |   ?sub c:IdentifiedObject.name ?station .
      |   ?sub c:IdentifiedObject.mRID ?sid .
      |   ?sub c:Substation.Region ?sgr .
      |   ?sgr c:IdentifiedObject.name ?subregion .
      |   ?sgr c:IdentifiedObject.mRID ?sgrid .
      |   ?sgr c:SubGeographicalRegion.Region ?rgn .
      |   ?rgn c:IdentifiedObject.name ?region .
      |   ?rgn c:IdentifiedObject.mRID ?rgnid .
      |}
      |ORDER by ?station ?feeder`.replace(/(?:\s+\|)/g, '\n').trim(),
      [Validators.checkNotEmpty('Query string')]
    ),
    objectId: new FormControlModel(this.props.feederModelLines.find(line => line.name === 'ieee8500')),
    modelId: new FormControlModel(this.props.feederModelLines.find(line => line.name === 'ieee8500')),
    filter: new FormControlModel('?s cim:IdentifiedObject.name \'q14733\'","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode'),
    resultFormat: new FormControlModel(QueryPowerGridModelsResultFormat.JSON)
  });

  readonly response = new FormControlModel(this.props.response);

  constructor(props: Props) {
    super(props);

    this.state = {
      lineOptionBuilder: new SelectionOptionBuilder(
        props.feederModelLines,
        line => line.name
      ),
      requestTypeOptionBuilder: new SelectionOptionBuilder(
        [
          QueryPowerGridModelsRequestType.QUERY,
          QueryPowerGridModelsRequestType.QUERY_MODEL,
          QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES,
          QueryPowerGridModelsRequestType.QUERY_OBJECT,
          QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES
        ]
      ),
      resultFormatOptionBuilder: new SelectionOptionBuilder(
        [
          QueryPowerGridModelsResultFormat.JSON,
          QueryPowerGridModelsResultFormat.CSV
        ]
      ),
      selectedRequestType: null,
      disableSubmitButton: true
    };

    this.onSubmitForm = this.onSubmitForm.bind(this);
  }

  componentDidMount() {
    this.formGroupModel.validityChanges()
      .subscribe({
        next: isValid => {
          this.setState({
            disableSubmitButton: !isValid
          });
        }
      });

    this.formGroupModel.findControl('requestType')
      .valueChanges()
      .subscribe({
        next: requestType => {
          this.response.setValue('');
          this.setState({
            selectedRequestType: requestType
          });
        }
      });
  }

  componentWillUnmount() {
    this.formGroupModel.cleanup();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps !== this.props) {
      this.response.setValue(this.props.response);
    }
  }

  render() {
    if (this.props.feederModelLines.length > 0) {
      const requestContainerStyles = this.response.getValue() === '' ? { height: '100%', maxHeight: '100%' } : {};
      return (
        <section className='powergrid-models'>
          <RequestEditor style={requestContainerStyles}>
            <Form
              className='query-powergrid-models__form'
              formGroupModel={this.formGroupModel}>
              <Select
                label='Request type'
                formControlModel={this.formGroupModel.findControl('requestType')}
                selectionOptionBuilder={this.state.requestTypeOptionBuilder} />
              <Select
                label='Result format'
                formControlModel={this.formGroupModel.findControl('resultFormat')}
                selectionOptionBuilder={this.state.resultFormatOptionBuilder}
                selectedOptionFinder={format => format === QueryPowerGridModelsResultFormat.JSON} />
              {
                this.showComponentForQueryType()
              }
              <BasicButton
                label='Submit'
                type='positive'
                disabled={this.state.disableSubmitButton}
                onClick={this.onSubmitForm} />
            </Form>
          </RequestEditor>
          <Response style={{ display: !this.props.response ? 'none' : 'block' }}>
            <TextArea
              type='plaintext'
              readonly
              label=''
              formControlModel={this.response} />
          </Response>
          <ProgressIndicator show={!this.props.isResponseReady} />
        </section>
      );
    }
    return null;
  }

  showComponentForQueryType() {
    switch (this.state.selectedRequestType) {
      case QueryPowerGridModelsRequestType.QUERY:
        return (
          <TextArea
            type='plaintext'
            label='Query string'
            formControlModel={this.formGroupModel.findControl('queryString')} />
        );
      case QueryPowerGridModelsRequestType.QUERY_OBJECT:
        return (
          <Select
            label='Object ID'
            formControlModel={this.formGroupModel.findControl('objectId')}
            selectionOptionBuilder={this.state.lineOptionBuilder}
            selectedOptionFinder={objectId => objectId.name === 'ieee8500'} />
        );
      case QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES:
        return (
          <Select
            label='Model ID'
            formControlModel={this.formGroupModel.findControl('modelId')}
            selectionOptionBuilder={this.state.lineOptionBuilder}
            selectedOptionFinder={modelId => modelId.name === 'ieee8500'} />
        );
      case QueryPowerGridModelsRequestType.QUERY_MODEL:
        return (
          <>
            <Select
              label='Model ID'
              formControlModel={this.formGroupModel.findControl('modelId')}
              selectionOptionBuilder={this.state.lineOptionBuilder}
              selectedOptionFinder={modelId => modelId.name === 'ieee8500'} />
            <TextArea
              type='plaintext'
              label='Filter'
              formControlModel={this.formGroupModel.findControl('filter')} />
          </>
        );
    }
    return null;
  }

  onSubmitForm() {
    const formValue = this.formGroupModel.getValue();
    this.props.onSubmit({
      ...formValue,
      objectId: formValue.objectId.id,
      modelId: formValue.modelId.id
    });
  }

}
