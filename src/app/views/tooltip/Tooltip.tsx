import * as React from 'react';
import { select } from 'd3-selection';
import { findDOMNode } from 'react-dom';

import './Tooltip.scss';

interface Props {
  show: boolean;
  onDismiss: () => void;
}

interface State {
  isVisible: boolean;
}

export class Tooltip extends React.Component<Props, State> {
  private _overlay: Element = null;

  constructor(props: any) {
    super(props);
    this.state = {
      isVisible: props.show || false
    };
  }

  componentDidMount() {
    this._overlay = findDOMNode(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (this._overlay && newProps !== this.props) {
      if (newProps.show)
        select(this._overlay.nextElementSibling)
          .style('display', 'block')
          .style('opacity', '0')
          .transition('fadein')
          .duration(500)
          .style('opacity', '1');
      else
        select(this._overlay.nextElementSibling)
          .style('opacity', '1')
          .transition('fadein')
          .duration(500)
          .on('end', () => (this._overlay.nextElementSibling as HTMLElement).style.display = 'none')
          .style('opacity', '0');
    }
  }
  render() {
    return (
      <>
        <div
          className='gridappsd-tooltip-overlay'
          style={{ display: this.props.show ? 'block' : 'none' }}
          onClick={event => {
            event.stopPropagation();
            this.props.onDismiss();
          }}>
        </div>
        <div className='gridappsd-tooltip'>
          <div className='gridappsd-tooltip__arrow' />
          {this.props.children}
        </div>
      </>
    );
  }

}