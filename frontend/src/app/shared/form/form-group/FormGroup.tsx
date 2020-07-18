import * as React from 'react';

import { Tooltip } from '@shared/tooltip';
import { IconButton } from '@shared/buttons';

import './FormGroup.light.scss';
import './FormGroup.dark.scss';

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

  readonly formControlContainerRef = React.createRef<HTMLDivElement>();

  private _contentHeight = 0;

  constructor(props: Props) {
    super(props);

    this.state = {
      collapsed: props.collapsed
    };

    this.toggleCollapse = this.toggleCollapse.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      if (this.props.collapsible) {
        this._contentHeight = this.formControlContainerRef.current.clientHeight;
        this._toggleFormControlContainerMaxHeight();
      }
    });
  }

  private _toggleFormControlContainerMaxHeight() {
    this.formControlContainerRef.current.style.maxHeight = `${this.state.collapsed ? 0 : this._contentHeight}px`;
  }

  render() {
    return (
      <div className={`form-group${this.props.className ? ' ' + this.props.className : ''}`}>
        {
          this.props.label
          &&
          <div className='form-group__header'>
            <div className='form-group__header__button-group'>
              {
                this.props.collapsible
                &&
                <Tooltip content={this.state.collapsed ? 'Expand' : 'Collapse'}>
                  <IconButton
                    className={`form-group__header__toggle ${this.state.collapsed ? 'collapse' : 'expand'}`}
                    icon='keyboard_arrow_down'
                    hasBackground={false}
                    onClick={this.toggleCollapse} />
                </Tooltip>
              }
            </div>
            <div className='form-group__header__label'>
              {this.props.label}
            </div>
          </div>
        }
        <div
          ref={this.formControlContainerRef}
          className={`form-group__controls ${this.state.collapsed ? 'collapsed' : 'expanded'}`}>
          {this.props.children}
        </div>
      </div>
    );
  }

  toggleCollapse() {
    this.setState(state => ({
      collapsed: !state.collapsed
    }), () => this._toggleFormControlContainerMaxHeight());
  }

}
