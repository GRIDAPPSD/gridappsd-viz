import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import {
  QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat
} from './models/QueryPowerGridModelsRequest';
import { MRID } from '@shared/MRID';
import { TextArea, Select, Option } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Wait } from '@shared/wait';

import './PowergridModels.scss';

interface Props {
  mRIDs: MRID[];
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
  response: string;
  isResponseReady: boolean;
}

interface State {
  response: any;
  requestBody: QueryPowerGridModelsRequestBody;
  optionsForMRIDs: Option[];
}

export class PowerGridModels extends React.Component<Props, State> {

  private readonly _COMPONENT_TO_SHOW_FOR_QUERY_TYPE = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      response: props.response,
      requestBody: {
        queryString: `SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder`,
        filter: `?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`
      } as QueryPowerGridModelsRequestBody,
      optionsForMRIDs: props.mRIDs.map(mRID => new Option(mRID.displayName, mRID.value))
    };

    this._COMPONENT_TO_SHOW_FOR_QUERY_TYPE = {
      [QueryPowerGridModelsRequestType.QUERY]: (
        <TextArea
          label='Query string'
          value='SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder'
          onUpdate={value => this._updateRequestBody('queryString', value)} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT]: (
        <Select
          label='Object ID'
          options={this.state.optionsForMRIDs}
          onChange={options => this._updateRequestBody('objectId', options[0].value)}
          isOptionSelected={option => option.label === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES]: (
        <Select
          label='Model ID'
          options={this.state.optionsForMRIDs}
          onChange={options => this._updateRequestBody('modelId', options[0].value)}
          isOptionSelected={option => option.label === 'ieee8500'} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_MODEL]: (
        <>
          <Select
            label='Model ID'
            options={this.state.optionsForMRIDs}
            onChange={options => this._updateRequestBody('modelId', options[0].value)}
            isOptionSelected={option => option.label === 'ieee8500'} />
          <TextArea
            label='Filter'
            value={`?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`}
            onUpdate={value => this._updateRequestBody('filter', value)} />
        </>
      )
    }

    this._updateRequestBody = this._updateRequestBody.bind(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps !== this.props)
      this.setState({ response: newProps.response });
  }

  render() {
    if (this.props.mRIDs.length > 0) {
      const requestContainerStyles = !this.state.response ? { height: '100%', maxHeight: '100%' } : {};
      return (
        <>
          <RequestEditor styles={requestContainerStyles}>
            <form className='query-powergrid-models-form'>
              <Select
                label='Request type'
                options={[
                  new Option(QueryPowerGridModelsRequestType.QUERY, QueryPowerGridModelsRequestType.QUERY),
                  new Option(QueryPowerGridModelsRequestType.QUERY_MODEL, QueryPowerGridModelsRequestType.QUERY_MODEL),
                  new Option(QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES, QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES),
                  new Option(QueryPowerGridModelsRequestType.QUERY_OBJECT, QueryPowerGridModelsRequestType.QUERY_OBJECT),
                  new Option(QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES, QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES),
                ]}
                onChange={options => {
                  this.setState({ response: null });
                  this._updateRequestBody('requestType', options[0].value);
                }} />

              <Select
                label='Result format'
                onChange={options => this._updateRequestBody('resultFormat', options[0].value)}
                options={[
                  new Option(QueryPowerGridModelsResultFormat.JSON, QueryPowerGridModelsResultFormat.JSON),
                  new Option(QueryPowerGridModelsResultFormat.CSV, QueryPowerGridModelsResultFormat.CSV),
                ]}
                isOptionSelected={(_, index) => index === 0} />
              {
                this._COMPONENT_TO_SHOW_FOR_QUERY_TYPE[this.state.requestBody.requestType]
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
  private _updateRequestBody(property: string, value: string) {
    this.setState({
      requestBody: {
        ...this.state.requestBody,
        [property]: value
      }
    });

  }
}