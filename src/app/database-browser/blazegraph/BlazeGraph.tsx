import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import { QueryBlazeGraphRequestType, QueryBlazeGraphRequestBody, QueryBlazeGraphRequestResultFormat } from '../../models/message-requests/QueryBlazeGraphRequest';
import { Wait } from '../../shared/views/wait/Wait';
import { MRID } from '../../models/MRID';
import { MultilineFormControl } from '../../shared/views/form/multiline-form-control/MultilineFormControl';
import { SelectFormControl } from '../../shared/views/form/select-form-control/SelectFormControl';
import { BasicButton } from '../../shared/views/buttons/basic-button/BasicButton';
import { MenuItem } from '../../shared/views/dropdown-menu/MenuItem';

import './BlazeGraph.scss';

interface Props {
  mRIDs: MRID[];
  onSubmit: (requestBody: QueryBlazeGraphRequestBody) => void;
  response: any;
  isResponseReady: boolean;
}

interface State {
  response: any;
  requestBody: QueryBlazeGraphRequestBody;
  menuItemsForMRIDs: MenuItem[];
}

export class BlazeGraph extends React.Component<Props, State> {

  private readonly _COMPONENT_TO_SHOW_FOR_QUERY_TYPE = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      response: props.response,
      requestBody: {
        queryString: `SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder`,
        filter: `?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`
      } as QueryBlazeGraphRequestBody,
      menuItemsForMRIDs: props.mRIDs.map(mRID => new MenuItem(mRID.displayName, mRID.value))
    };

    this._COMPONENT_TO_SHOW_FOR_QUERY_TYPE = {
      [QueryBlazeGraphRequestType.QUERY]: (
        <MultilineFormControl
          label='Query string'
          value='SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder'
          onUpdate={value => this._updateRequestBody('queryString', value)} />
      ),
      [QueryBlazeGraphRequestType.QUERY_OBJECT]: (
        <SelectFormControl
          label='Object ID'
          menuItems={this.state.menuItemsForMRIDs}
          onChange={menuItem => this._updateRequestBody('objectId', menuItem.value)}
          defaultSelectedIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
      ),
      [QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES]: (
        <SelectFormControl
          label='Model ID'
          menuItems={this.state.menuItemsForMRIDs}
          onChange={menuItem => this._updateRequestBody('modelId', menuItem.value)}
          defaultSelectedIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
      ),
      [QueryBlazeGraphRequestType.QUERY_MODEL]: (
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
            <form className='blazegraph-form'>
              <SelectFormControl
                label='Request type'
                menuItems={[
                  new MenuItem(QueryBlazeGraphRequestType.QUERY, QueryBlazeGraphRequestType.QUERY),
                  new MenuItem(QueryBlazeGraphRequestType.QUERY_MODEL, QueryBlazeGraphRequestType.QUERY_MODEL),
                  new MenuItem(QueryBlazeGraphRequestType.QUERY_MODEL_NAMES, QueryBlazeGraphRequestType.QUERY_MODEL_NAMES),
                  new MenuItem(QueryBlazeGraphRequestType.QUERY_OBJECT, QueryBlazeGraphRequestType.QUERY_OBJECT),
                  new MenuItem(QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES, QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES),
                ]}
                onChange={menuItem => {
                  this.setState({ response: null });
                  this._updateRequestBody('requestType', menuItem.value);
                }} />

              <SelectFormControl
                label='Result format'
                onChange={menuItem => this._updateRequestBody('resultFormat', menuItem.value)}
                menuItems={[
                  new MenuItem(QueryBlazeGraphRequestResultFormat.JSON, QueryBlazeGraphRequestResultFormat.JSON),
                  new MenuItem(QueryBlazeGraphRequestResultFormat.CSV, QueryBlazeGraphRequestResultFormat.CSV),
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