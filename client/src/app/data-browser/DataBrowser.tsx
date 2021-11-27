import * as React from 'react';
import { NavLink, Route, Redirect } from 'react-router-dom';

import { FeederModel, FeederModelLine } from '@client:common/topology';

import { PowergridModelsContainer } from './powergrid-models';
import { LogsContainer } from './logs';
import { SimulationsContainer } from './simulations';

import './DataBrowser.light.scss';
import './DataBrowser.dark.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any;
  feederModel: FeederModel;
}

interface State {
  hasError: boolean;
  feederModelLines: FeederModelLine[];
}

export class DataBrowser extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      feederModelLines: Object.values(props.feederModel)
        .reduce((accumulator, region) => {
          accumulator.push(...region.lines);
          return accumulator;
        }, [])
    };
  }

  componentDidCatch() {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      this.setState({
        hasError: false
      });
      return <Redirect to='/' />;
    }

    const props = this.props;
    return (
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
        <div className='data-browser__body'>
          <Route
            exact
            path={`${props.match.path}`}
            render={() => <div className='vertical-divider' />} />
          <Route
            path={`${props.match.path}/powergrid-models`}
            component={() => <PowergridModelsContainer feederModelLines={this.state.feederModelLines} />} />
          <Route
            path={`${props.match.path}/logs`}
            component={LogsContainer} />
          <Route
            path={`${props.match.path}/simulations`}
            component={SimulationsContainer} />
        </div>
      </div>
    );
  }

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
