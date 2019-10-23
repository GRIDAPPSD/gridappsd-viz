import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import {
  QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat
} from './models/QueryPowerGridModelsRequest';
import { TextArea, Select, Option } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Wait } from '@shared/wait';
import { FeederModelLine } from '@shared/topology';

import './PowergridModels.scss';

interface Props {
  feederModelLines: FeederModelLine[];
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
  response: string;
  isResponseReady: boolean;
}

interface State {
  response: any;
  requestBody: QueryPowerGridModelsRequestBody;
  lineOptions: Option<string>[];
  requestTypeOptions: Option<QueryPowerGridModelsRequestType>[];
  resultFormatOptions: Option<QueryPowerGridModelsResultFormat>[];
}

export class PowerGridModels extends React.Component<Props, State> {

  readonly componentToShowForQueryType = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      response: props.response,
      requestBody: {
        queryString: `SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder`,
        filter: `?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`
      } as QueryPowerGridModelsRequestBody,
      lineOptions: props.feederModelLines.map(line => new Option(line.name, line.id)),
      requestTypeOptions: [
        new Option(QueryPowerGridModelsRequestType.QUERY, QueryPowerGridModelsRequestType.QUERY),
        new Option(QueryPowerGridModelsRequestType.QUERY_MODEL, QueryPowerGridModelsRequestType.QUERY_MODEL),
        new Option(QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES, QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES),
        new Option(QueryPowerGridModelsRequestType.QUERY_OBJECT, QueryPowerGridModelsRequestType.QUERY_OBJECT),
        new Option(QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES, QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES),
      ],
      resultFormatOptions: [
        new Option(QueryPowerGridModelsResultFormat.JSON, QueryPowerGridModelsResultFormat.JSON),
        new Option(QueryPowerGridModelsResultFormat.CSV, QueryPowerGridModelsResultFormat.CSV),
      ]
    };

    this.componentToShowForQueryType = {
      [QueryPowerGridModelsRequestType.QUERY]: (
        <TextArea
          label='Query string'
          value='SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder'
          onChange={value => this.updateRequestBody('queryString', value)} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT]: (
        <Select
          multiple={false}
          label='Object ID'
          options={this.state.lineOptions}
          onChange={selectedOption => this.updateRequestBody('objectId', selectedOption.value)}
          isOptionSelected={option => option.label === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES]: (
        <Select
          multiple={false}
          label='Model ID'
          options={this.state.lineOptions}
          onChange={selectedOption => this.updateRequestBody('modelId', selectedOption.value)}
          isOptionSelected={option => option.label === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_MODEL]: (
        <>
          <Select
            multiple={false}
            label='Model ID'
            options={this.state.lineOptions}
            onChange={selectedOption => this.updateRequestBody('modelId', selectedOption.value)}
            isOptionSelected={option => option.label === 'ieee8500'} />
          <TextArea
            label='Filter'
            value={`?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`}
            onChange={value => this.updateRequestBody('filter', value)} />
        </>
      )
    };

    this.updateRequestBody = this.updateRequestBody.bind(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps !== this.props)
      this.setState({ response: newProps.response });
  }

  render() {
    if (this.props.feederModelLines.length > 0) {
      const requestContainerStyles = !this.state.response ? { height: '100%', maxHeight: '100%' } : {};
      return (
        <>
          <RequestEditor styles={requestContainerStyles}>
            <form className='query-powergrid-models-form'>
              <Select
                multiple={false}
                label='Request type'
                options={this.state.requestTypeOptions}
                onChange={selectedOption => {
                  this.setState({ response: null });
                  this.updateRequestBody('requestType', selectedOption.value);
                }} />
              <Select
                multiple={false}
                label='Result format'
                onChange={selectedOption => this.updateRequestBody('resultFormat', selectedOption.value)}
                options={this.state.resultFormatOptions}
                isOptionSelected={option => option.value === QueryPowerGridModelsResultFormat.JSON} />
              {
                this.componentToShowForQueryType[this.state.requestBody.requestType]
              }
              <BasicButton
                label='Submit'
                type='positive'
                disabled={!this.state.requestBody.requestType}
                onClick={() => this.props.onSubmit(this.state.requestBody)} />
            </form>
          </RequestEditor>
          {
            this.state.response &&
            <Response>
              {this.state.response}
            </Response>
          }
          <Wait show={!this.props.isResponseReady} />
        </>
      );
    }
    return null;
  }

  updateRequestBody(property: string, value: string) {
    this.setState({
      requestBody: {
        ...this.state.requestBody,
        [property]: value
      }
    });
  }

}
