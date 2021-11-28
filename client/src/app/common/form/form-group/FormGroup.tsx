import { Component, createRef } from 'react';

import { Tooltip } from '@client:common/tooltip';
import { IconButton } from '@client:common/buttons';

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
  maxHeight: number;
}

export class FormGroup extends Component<Props, State> {

  static defaultProps = {
    collapsible: true,
    collapsed: false
  };

  readonly formControlContainerRef = createRef<HTMLDivElement>();

  private _maxHeight = 0;

  constructor(props: Props) {
    super(props);

    this.state = {
      collapsed: props.collapsed,
      maxHeight: Number.MAX_SAFE_INTEGER
    };

    this.toggleCollapse = this.toggleCollapse.bind(this);
  }

  componentDidMount() {
    if (this.props.collapsible) {
      setTimeout(() => {
        this._maxHeight = this.formControlContainerRef.current.getBoundingClientRect().height;
        this.setState({
          maxHeight: this.props.collapsed ? 0 : this._maxHeight
        });
      });
    }
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
                    className={`form-group__header__toggle ${this.state.collapsed ? 'collapsed' : 'expanded'}`}
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
          className='form-group__controls'
          style={{
            maxHeight: this.state.maxHeight
          }}>
          {this.props.children}
        </div>
      </div>
    );
  }

  toggleCollapse() {
    this.setState(state => ({
      collapsed: !state.collapsed,
      maxHeight: state.collapsed ? this._maxHeight : 0
    }));
  }

}
