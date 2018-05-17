import * as React from 'react';

import { RequestEditor } from '../RequestEditor';
import { Response } from '../Response';
import { MRID } from '../../../models/MRID';
import { DropdownMenu } from '../../dropdown-menu/DropdownMenu';
import { MenuItem } from '../../dropdown-menu/MenuItem';
import { QueryBlazeGraphRequestType, QueryBlazeGraphRequestBody, QueryBlazeGraphRequestResultFormat } from '../../../models/message-requests/QueryBlazeGraphRequest';

import './BlazeGraph.styles.scss';
import { Wait } from '../../wait/Wait';

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
        <div className='control'>
          <label>Query String</label>
          <div
            className='str-editor'
            contentEditable
            suppressContentEditableWarning
            onBlur={event => {
              const newValue = (event.target as HTMLDivElement).textContent;
              this._updateRequestBody('queryString', newValue);
            }}>
            {`SELECT ?feeder ?fid  WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?feeder.?s c:IdentifiedObject.mRID ?fid.?s c:Feeder.NormalEnergizingSubstation ?sub.?sub c:IdentifiedObject.name ?station.?sub c:IdentifiedObject.mRID ?sid.?sub c:Substation.Region ?sgr.?sgr c:IdentifiedObject.name ?subregion.?sgr c:IdentifiedObject.mRID ?sgrid.?sgr c:SubGeographicalRegion.Region ?rgn.?rgn c:IdentifiedObject.name ?region.?rgn c:IdentifiedObject.mRID ?rgnid.}  ORDER by ?station ?feeder`}
          </div>
        </div>
      ),
      [QueryBlazeGraphRequestType.QUERY_OBJECT]: (
        <div className='control'>
          <label>Object ID</label>
          <DropdownMenu
            onChange={menuItem => this._updateRequestBody('objectId', menuItem.value)}
            menuItems={this.state.menuItemsForMRIDs}
            defaultItemIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
        </div>
      ),
      [QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES]: (
        <div className='control'>
          <label>Model ID</label>
          <DropdownMenu
            onChange={menuItem => this._updateRequestBody('modelId', menuItem.value)}
            menuItems={this.state.menuItemsForMRIDs}
            defaultItemIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
        </div>
      ),
      [QueryBlazeGraphRequestType.QUERY_MODEL]: (
        <>
          <div className='control'>
            <label>Model ID</label>
            <DropdownMenu
              onChange={menuItem => this._updateRequestBody('modelId', menuItem.value)}
              menuItems={this.state.menuItemsForMRIDs}
              defaultItemIndex={this.props.mRIDs.filter((mRID, index) => mRID.displayName === 'ieee8500')[0].index} />
          </div>
          <div className='control'>
            <label>Filter</label>
            <div
              className='str-editor'
              contentEditable
              suppressContentEditableWarning
              onBlur={event => {
                const newValue = (event.target as HTMLDivElement).textContent;
                this._updateRequestBody('filter', newValue);
              }}>
              {`?s cim:IdentifiedObject.name \u0027q14733\u0027","objectType":"http://iec.ch/TC57/2012/CIM-schema-cim17#ConnectivityNode`}
            </div>
          </div>
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
              <div className='control'>
                <label>Request Type</label>
                <DropdownMenu
                  onChange={menuItem => {
                    this.setState({ response: null });
                    this._updateRequestBody('requestType', menuItem.value);
                  }}
                  menuItems={[
                    new MenuItem(QueryBlazeGraphRequestType.QUERY, QueryBlazeGraphRequestType.QUERY),
                    new MenuItem(QueryBlazeGraphRequestType.QUERY_MODEL, QueryBlazeGraphRequestType.QUERY_MODEL),
                    new MenuItem(QueryBlazeGraphRequestType.QUERY_MODEL_NAMES, QueryBlazeGraphRequestType.QUERY_MODEL_NAMES),
                    new MenuItem(QueryBlazeGraphRequestType.QUERY_OBJECT, QueryBlazeGraphRequestType.QUERY_OBJECT),
                    new MenuItem(QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES, QueryBlazeGraphRequestType.QUERY_OBJECT_TYPES),
                  ]} />
              </div>
              <div className='control'>
                <label>Result Format</label>
                <DropdownMenu
                  onChange={menuItem => this._updateRequestBody('resultFormat', menuItem.value)}
                  menuItems={[
                    new MenuItem(QueryBlazeGraphRequestResultFormat.JSON, QueryBlazeGraphRequestResultFormat.JSON),
                    new MenuItem(QueryBlazeGraphRequestResultFormat.CSV, QueryBlazeGraphRequestResultFormat.CSV),
                  ]}
                  defaultItemIndex={0} />
              </div>
              {
                this._COMPONENT_TO_SHOW_FOR_QUERY_TYPE[this.state.requestBody.requestType]
              }
              <button
                type='button'
                className='submit button positive'
                disabled={!this.state.requestBody.requestType}
                onClick={() => this.props.onSubmit(this.state.requestBody)}>
                Submit
              </button>
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