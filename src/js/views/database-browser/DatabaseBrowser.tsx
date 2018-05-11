import * as React from 'react';
import { NavLink, Route } from 'react-router-dom';

import { BlazeGraphContainer } from './blazegraph/BlazeGraphContainer';
import { MySqlContainer } from './mysql/MySqlContainer';
import { InfluxDbContainer } from './influxdb/InfluxDbContainer';

import './DatabaseBrowser.styles.scss';

export const DatabaseBrowser = ({ match }) => (
  <div className='database-browser'>
    <ul className='database-list-selection'>
      <li>
        <NavLink activeClassName='selected' className='database' to={`${match.url}/blazegraph`}>BlazeGraph</NavLink>
      </li>
      <li>
        <NavLink activeClassName='selected' className='database' to={`${match.url}/mysql`}>MYSQL</NavLink>
      </li>
      <li>
        <NavLink activeClassName='selected' className='database' to={`${match.url}/influxdb`}>InfluxDB</NavLink>
      </li>
    </ul>
    <div className='request-response'>
      <Route
        exact
        path={`${match.path}`}
        render={() => <div className='vertical-divider' style={{ width: '1px', boxShadow: '0 0 2px #888', 'height': '100%' }} />} />
      <Route path={`${match.path}/blazegraph`} component={BlazeGraphContainer} />
      <Route path={`${match.path}/mysql`} component={MySqlContainer} />
      <Route path={`${match.path}/influxdb`} component={InfluxDbContainer} />
    </div>
  </div>
);