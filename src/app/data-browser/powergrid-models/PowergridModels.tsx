import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import { QueryPowerGridModelsRequestType, QueryPowerGridModelsRequestBody, QueryPowerGridModelsResultFormat } from '../../models/message-requests/QueryPowerGridModelsRequest';
import { MRID } from '../../models/MRID';

import './PowergridModels.scss';
import { MenuItem } from '@shared/dropdown-menu';
import { MultilineFormControl, SelectFormControl } from '@shared/form';
import { BasicButton } from '@shared/buttons';
import { Wait } from '@shared/wait';

interface Props {
  mRIDs: MRID[];
  onSubmit: (requestBody: QueryPowerGridModelsRequestBody) => void;
  response: any;
  isResponseReady: boolean;
}

interface State {
  response: any;
  requestBody: QueryPowerGridModelsRequestBody;
  menuItemsForMRIDs: MenuItem[];
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
      menuItemsForMRIDs: props.mRIDs.map(mRID => new MenuItem(mRID.displayName, mRID.value))
    };

    this._COMPONENT_TO_SHOW_FOR_QUERY_TYPE = {
      [QueryPowerGridModelsRequestType.QUERY]: (
        <MultilineFormControl
          label='Query string'
          value='SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder'
          onUpdate={value => this._updateRequestBody('queryString', value)} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT]: (
        <SelectFormControl
          label='Object ID'
          menuItems={this.state.menuItemsForMRIDs}
          onChange={menuItem => this._updateRequestBody('objectId', menuItem.value)}
          defaultSelectedIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES]: (
        <SelectFormControl
          label='Model ID'
          menuItems={this.state.menuItemsForMRIDs}
          onChange={menuItem => this._updateRequestBody('modelId', menuItem.value)}
          defaultSelectedIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
      ),
      [QueryPowerGridModelsRequestType.QUERY_MODEL]: (
        <>
          <SelectFormControl
            label='Model ID'
            menuItems={this.state.menuItemsForMRIDs}
            onChange={menuItem => this._updateRequestBody('modelId', menuItem.value)}
            defaultSelectedIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
          <MultilineFormControl
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
              <SelectFormControl
                label='Request type'
                menuItems={[
                  new MenuItem(QueryPowerGridModelsRequestType.QUERY, QueryPowerGridModelsRequestType.QUERY),
                  new MenuItem(QueryPowerGridModelsRequestType.QUERY_MODEL, QueryPowerGridModelsRequestType.QUERY_MODEL),
                  new MenuItem(QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES, QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES),
                  new MenuItem(QueryPowerGridModelsRequestType.QUERY_OBJECT, QueryPowerGridModelsRequestType.QUERY_OBJECT),
                  new MenuItem(QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES, QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES),
                ]}
                onChange={menuItem => {
                  this.setState({ response: null });
                  this._updateRequestBody('requestType', menuItem.value);
                }} />

              <SelectFormControl
                label='Result format'
                onChange={menuItem => this._updateRequestBody('resultFormat', menuItem.value)}
                menuItems={[
                  new MenuItem(QueryPowerGridModelsResultFormat.JSON, QueryPowerGridModelsResultFormat.JSON),
                  new MenuItem(QueryPowerGridModelsResultFormat.CSV, QueryPowerGridModelsResultFormat.CSV),
                ]}
                defaultSelectedIndex={0} />
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
              {JSON.stringify(this.state.response, null, 4)}
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