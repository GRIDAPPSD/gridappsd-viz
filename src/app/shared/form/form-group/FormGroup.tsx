import * as React from 'react';

import { Tooltip } from '@shared/tooltip';

import './FormGroup.scss';

interface Props {
  className?: string;
  label?: string;
  collapsible?: boolean;
  collapsed?: boolean;
}

interface State {
  collapsed: boolean;
}

export class FormGroup extends React.Component<Props, State> {

  static defaultProps = {
    collapsible: true,
    collapsed: false
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      collapsed: props.collapsed
    };

    this.toggleCollapse = this.toggleCollapse.bind(this);
  }

  render() {
    return (
      <div className={`form-group${this.props.className ? ' ' + this.props.className : ''}`}>
        {
          this.props.label !== ''
          &&
          <div className='form-group__header'>
            <div className='form-group__header__button-group'>
              {
                this.props.collapsible
                &&
                <Tooltip content={this.state.collapsed ? 'Expand' : 'Collapse'}>
                  <i
                    className='material-icons'
                    onClick={this.toggleCollapse}>
                    {this.state.collapsed ? 'add' : 'remove'}
                  </i>
                </Tooltip>
              }
            </div>
            <div className='form-group__header__label'>
              {this.props.label}
            </div>
          </div>
        }
        <div className={`form-group__controls ${this.state.collapsed ? 'collapsed' : 'expanded'}`}>
          {this.props.children}
        </div>
      </div>
    );
  }

  toggleCollapse() {
    this.setState(state => ({
      collapsed: !state.collapsed
    }));
  }

}
