import { useEffect, useState } from 'react';
import { NavLink, Route, Outlet, Routes } from 'react-router-dom';

import { FeederModel, FeederModelLine } from '@client:common/topology';

import { LogsContainer } from './logs';
import { PowergridModelsContainer } from './powergrid-models';
import { SimulationsContainer } from './simulations';

import './DataBrowser.light.scss';
import './DataBrowser.dark.scss';

interface Props {
  feederModel: FeederModel;
}

export function DataBrowser(props: Props) {
  const [feederModelLines, setFeederModelLines] = useState<FeederModelLine[]>([]);

  useEffect(() => {
    const updatedFeederModelLines = Object.values(props.feederModel)
      .reduce((accumulator, region) => {
        accumulator.push(...region.lines);
        return accumulator;
      }, []);
    setFeederModelLines(updatedFeederModelLines);
  }, [props.feederModel]);

  return (
    <Routes>
      <Route
        path='/*'
        element={
          <div className='data-browser'>
            <ul className='data-browser__selection'>
              <li>
                <NavLink
                  className={({ isActive }) => `data-browser__selection__item${isActive ? ' selected' : ''}`}
                  to='powergrid-models'>
                  Powergrid Models
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) => `data-browser__selection__item${isActive ? ' selected' : ''}`}
                  to='logs'>
                  Logs
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) => `data-browser__selection__item${isActive ? ' selected' : ''}`}
                  to='simulations'>
                  Simulations
                </NavLink>
              </li>
            </ul>
            <div className='data-browser__body'>
              <Outlet />
            </div>
          </div>
        }>
        <Route
          path='powergrid-models'
          element={<PowergridModelsContainer feederModelLines={feederModelLines} />} />
        <Route
          path='logs'
          element={<LogsContainer />} />
        <Route
          path='simulations'
          element={<SimulationsContainer />} />
        <Route
          path='*'
          element={<div className='vertical-divider' />} />
      </Route>
    </Routes>
  );
}

interface RequestProps {
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}
export function RequestEditor(props: RequestProps) {
  return (
    <div
      className='data-browser__request'
      style={props.style}>
      {props.children}
    </div>
  );
}

interface ResponseProps {
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}

export function Response(props: ResponseProps) {
  return (
    <div
      className='data-browser__response'
      style={props.style}>
      {props.children}
    </div>
  );
}
