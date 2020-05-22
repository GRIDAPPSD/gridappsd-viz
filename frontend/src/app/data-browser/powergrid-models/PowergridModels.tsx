import * as React from 'react';

import {
  QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat
} from './models/QueryPowerGridModelsRequest';
import { TextArea, Select, SelectionOptionBuilder, FormGroupModel, FormControlModel, Form } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';
import { FeederModelLine } from '@shared/topology';
import { Validators } from '@shared/form/validation';
import { RequestEditor, Response } from '../DataBrowser';

import './PowergridModels.light.scss';
import './PowergridModels.dark.scss';

interface Props {
  feederModelLines: FeederModelLine[];
  response: string;
  isResponseReady: boolean;
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
}

interface State {
  response: any;
  lineOptionBuilder: SelectionOptionBuilder<FeederModelLine>;
  requestTypeOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsRequestType>;
  resultFormatOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsResultFormat>;
  selectedRequestType: QueryPowerGridModelsRequestType;
  disableSubmitButton: boolean;
}

export class PowerGridModels extends React.Component<Props, State> {

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
    filter: new FormControlModel(`?s cim:IdentifiedObject.name 'q14733'","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`),
    resultFormat: new FormControlModel(QueryPowerGridModelsResultFormat.JSON)
  });

  constructor(props: Props) {
    super(props);

    this.state = {
      response: props.response,
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
          this.setState({
            response: null,
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
      this.setState({
        response: this.props.response
      });
    }
  }

  render() {
    if (this.props.feederModelLines.length > 0) {
      const requestContainerStyles = !this.state.response ? { height: '100%', maxHeight: '100%' } : {};
      return (
        <>
          <RequestEditor styles={requestContainerStyles}>
            <Form
              className='query-powergrid-models-form'
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
          {
            this.state.response
            &&
            <Response>
              {this.state.response}
            </Response>
          }
          <ProgressIndicator show={!this.props.isResponseReady} />
        </>
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
