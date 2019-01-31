import * as React from 'react';
import { NavLink, Route } from 'react-router-dom';

import { PowergridModelsContainer } from './powergrid-models/PowergridModelsContainer';
import { LogsContainer } from './logs/LogsContainer';
import { SimulationsContainer } from './simulations/SimulationsContainer';
import { MRID } from '../models/MRID';

import './DataBrowser.scss';

interface Props {
  match: any;
  mRIDs: MRID[];
}
export const DataBrowser = (props: Props) => (
  <div className='data-browser'>
    <ul className='data-browser__selection'>
      <li>
        <NavLink
          activeClassName='selected'
          className='data-browser__selection__item'
          to={`${props.match.url}/powergrid-models`}>
          Powergrid Models
          </NavLink>
      </li>
      <li>
        <NavLink
          activeClassName='selected'
          className='data-browser__selection__item'
          to={`${props.match.url}/logs`}>
          Logs
        </NavLink>
      </li>
      <li>
        <NavLink
          activeClassName='selected'
          className='data-browser__selection__item'
          to={`${props.match.url}/simulations`}>
          Simulations
        </NavLink>
      </li>
    </ul>
    <div className='request-response'>
      <Route
        exact
        path={`${props.match.path}`}
        render={() => <div className='vertical-divider' style={{ width: '1px', boxShadow: '0 0 2px #888', 'height': '100%' }} />} />
      <Route path={`${props.match.path}/powergrid-models`} component={() => <PowergridModelsContainer mRIDs={props.mRIDs} />} />
      <Route path={`${props.match.path}/logs`} component={LogsContainer} />
      <Route path={`${props.match.path}/simulations`} component={SimulationsContainer} />
    </div>
  </div>
);