import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import {
  QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat
} from './models/QueryPowerGridModelsRequest';
import { TextArea, Select, SelectionOptionBuilder } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Wait } from '@shared/wait';
import { FeederModelLine } from '@shared/topology';

import './PowergridModels.light.scss';
import './PowergridModels.dark.scss';

interface Props {
  feederModelLines: FeederModelLine[];
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
  response: string;
  isResponseReady: boolean;
}

interface State {
  response: any;
  requestBody: QueryPowerGridModelsRequestBody;
  lineOptionBuilder: SelectionOptionBuilder<FeederModelLine>;
  requestTypeOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsRequestType>;
  resultFormatOptionBuilder: SelectionOptionBuilder<QueryPowerGridModelsResultFormat>;
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
      )
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
          label='Object ID'
          selectionOptionBuilder={this.state.lineOptionBuilder}
          onChange={selectedValue => this.updateRequestBody('objectId', selectedValue.id)}
          selectedOptionFinder={objectId => objectId.name === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES]: (
        <Select
          label='Model ID'
          selectionOptionBuilder={this.state.lineOptionBuilder}
          onChange={selectedValue => this.updateRequestBody('modelId', selectedValue.id)}
          selectedOptionFinder={modelId => modelId.name === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_MODEL]: (
        <>
          <Select
            label='Model ID'
            selectionOptionBuilder={this.state.lineOptionBuilder}
            onChange={selectedValue => this.updateRequestBody('modelId', selectedValue.id)}
            selectedOptionFinder={modelId => modelId.name === 'ieee8500'} />
          <TextArea
            label='Filter'
            value={`?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`}
            onChange={value => this.updateRequestBody('filter', value)} />
        </>
      )
    };

    this.updateRequestBody = this.updateRequestBody.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps !== this.props)
      this.setState({
        response: this.props.response
      });
  }

  render() {
    if (this.props.feederModelLines.length > 0) {
      const requestContainerStyles = !this.state.response ? { height: '100%', maxHeight: '100%' } : {};
      return (
        <>
          <RequestEditor styles={requestContainerStyles}>
            <form className='query-powergrid-models-form'>
              <Select
                label='Request type'
                selectionOptionBuilder={this.state.requestTypeOptionBuilder}
                onChange={selectedValue => {
                  this.setState({
                    response: null
                  });
                  this.updateRequestBody('requestType', selectedValue);
                }} />
              <Select
                label='Result format'
                onChange={selectedValue => this.updateRequestBody('resultFormat', selectedValue)}
                selectionOptionBuilder={this.state.resultFormatOptionBuilder}
                selectedOptionFinder={format => format === QueryPowerGridModelsResultFormat.JSON} />
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
