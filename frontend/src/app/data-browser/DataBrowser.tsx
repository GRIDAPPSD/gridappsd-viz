import * as React from 'react';
import { NavLink, Route, Redirect } from 'react-router-dom';

import { PowergridModelsContainer } from './powergrid-models';
import { LogsContainer } from './logs';
import { SimulationsContainer } from './simulations';
import { FeederModel, FeederModelLine } from '@shared/topology';

import './DataBrowser.light.scss';
import './DataBrowser.dark.scss';

interface Props {
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
        <div className='request-response'>
          <Route
            exact
            path={`${props.match.path}`}
            render={() => <div className='vertical-divider' style={{ width: '1px', boxShadow: '0 0 2px #888', 'height': '100%' }} />} />
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
