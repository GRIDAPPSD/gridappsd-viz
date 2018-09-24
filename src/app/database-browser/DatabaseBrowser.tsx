import * as React from 'react';
import { NavLink, Route } from 'react-router-dom';

import { BlazeGraphContainer } from './blazegraph/BlazeGraphContainer';
import { MySqlContainer } from './mysql/MySqlContainer';
import { InfluxDbContainer } from './influxdb/InfluxDbContainer';
import { MRID } from '../models/MRID';

import './DatabaseBrowser.scss';

interface Props {
  match: any;
  mRIDs: MRID[];
}
export const DatabaseBrowser = (props: Props) => (
  <div className='database-browser'>
    <ul className='database-browser__database-list-selection'>
      <li>
        <NavLink activeClassName='selected' className='database-browser__database-list-selection__database' to={`${props.match.url}/blazegraph`}>BlazeGraph</NavLink>
      </li>
      <li>
        <NavLink activeClassName='selected' className='database-browser__database-list-selection__database' to={`${props.match.url}/mysql`}>MYSQL</NavLink>
      </li>
      <li>
        <NavLink activeClassName='selected' className='database-browser__database-list-selection__database' to={`${props.match.url}/influxdb`}>InfluxDB</NavLink>
      </li>
    </ul>
    <div className='request-response'>
      <Route
        exact
        path={`${props.match.path}`}
        render={() => <div className='vertical-divider' style={{ width: '1px', boxShadow: '0 0 2px #888', 'height': '100%' }} />} />
      <Route path={`${props.match.path}/blazegraph`} component={() => <BlazeGraphContainer mRIDs={props.mRIDs} />} />
      <Route path={`${props.match.path}/mysql`} component={MySqlContainer} />
      <Route path={`${props.match.path}/influxdb`} component={InfluxDbContainer} />
    </div>
  </div>
);