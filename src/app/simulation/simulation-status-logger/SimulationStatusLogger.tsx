import * as React from 'react';

import { SimulationStatusLogMessage } from './views/simulation-status-log-message/SimulationStatusLogMessage';
import { Wait } from '../../shared/views/wait/Wait';

import './SimulationStatusLogger.scss';

interface Props {
  messages: string[];
  isFetching: boolean;
}

interface State {
  heightDelta: number;
}

export class SimulationStatusLogger extends React.Component<Props, State> {
  private _dragStartVerticalAnchor = 35;
  private _minHeight = 35;
  private _messagesContainer: HTMLElement = null;

  constructor(props: any) {
    super(props);
    this.state = {
      heightDelta: 0
    };
    this._mouseDown = this._mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._resize = this._resize.bind(this);
  }

  render() {
    return (
      <div
        className='simulation-status-logger'
        style={{
          top: `-${this.state.heightDelta}px`,
          height: `calc(${this._minHeight}vh + ${this.state.heightDelta}px)`
        }}>
        <header>
          <span>Simulation Status</span>
        </header>
        <div className='simulation-status-logger__drag-handle' onMouseDown={this._mouseDown} />
        <section className='simulation-status-logger__content' ref={elem => this._messagesContainer = elem}>
          {
            this.props.messages.map((message, i) => {
              return <SimulationStatusLogMessage key={i} message={message} />;
            })
          }
        </section>
        <Wait show={this.props.isFetching} />
      </div>
    );
  }

  private _mouseDown(event) {
    this._dragStartVerticalAnchor = event.clientY + this.state.heightDelta;
    this._messagesContainer.style.userSelect = 'none';
    document.documentElement.addEventListener('mousemove', this._resize, false);
    document.documentElement.addEventListener('mouseup', this._mouseUp, false);
  }

  private _mouseUp() {
    this._messagesContainer.style.userSelect = 'initial';
    window.getSelection().empty();
    document.documentElement.removeEventListener('mousemove', this._resize, false);
    document.documentElement.removeEventListener('mouseup', this._mouseUp, false);
  }

  private _resize(event) {
    const heightDelta = -(event.clientY - this._dragStartVerticalAnchor);
    this.setState({ heightDelta: heightDelta > 0 ? heightDelta : 0 });
  }
}