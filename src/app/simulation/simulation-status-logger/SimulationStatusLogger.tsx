import * as React from 'react';

import { SimulationStatusLoggerMessage } from './SimulationStatusLoggerMessage';
import { Wait } from '@shared/wait';

import './SimulationStatusLogger.scss';

interface Props {
  messages: string[];
  isFetching: boolean;
  simulationRunning: boolean;
}

interface State {
  dragHandlePosition: number;
}

export class SimulationStatusLogger extends React.Component<Props, State> {

  simulationStatusLoggerBody: HTMLElement = null;

  private readonly _dragHandleMinPosition = 30;
  private readonly _dragHandleMaxPosition = document.body.clientHeight - 110;
  private readonly _logLevelAndColorTupleList = [
    ['FATAL', '#B71C1C'],
    ['ERROR', '#D32F2F'],
    ['WARN', '#FFFF00'],
    ['INFO', '#F0F4C3'],
    ['DEBUG', '#E1F5FE'],
    ['TRACE', '#C0CA33']
  ];

  constructor(props: any) {
    super(props);
    this.state = {
      dragHandlePosition: this._dragHandleMaxPosition
    };
    this.mouseDown = this.mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._resize = this._resize.bind(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps !== this.props && newProps.simulationRunning)
      this.setState({ dragHandlePosition: 430 });
  }

  render() {

    return (
      <div
        className='simulation-status-logger'
        style={{
          top: `${this.state.dragHandlePosition}px`
        }}>
        <header
          className='simulation-status-logger__header'
          onMouseDown={this.mouseDown} >
          <span className='simulation-status-logger__header__label'>Simulation Status</span>
          {
            this.props.messages.length > 0
            &&
            <div className='simulation-status-logger__header__legends'>
              {
                this._logLevelAndColorTupleList.map((tuple, i) => (
                  <div key={i} className='simulation-status-logger__header__legends__level'>
                    <span
                      className='simulation-status-logger__header__legends__level__color'
                      style={{ backgroundColor: tuple[1] }} />
                    <span className='simulation-status-logger__header__legends__level__label'>{tuple[0]}</span>
                  </div>
                ))
              }
            </div>
          }
        </header>
        <section
          className='simulation-status-logger__body'
          ref={elem => this.simulationStatusLoggerBody = elem}>
          {
            this.props.messages.map((message, i, messages) => (
              <SimulationStatusLoggerMessage key={messages.length - i} message={message} />
            ))
          }
        </section>
        <Wait show={this.props.isFetching} />
      </div>
    );
  }

  mouseDown() {
    this.simulationStatusLoggerBody.style.userSelect = 'none';
    document.documentElement.addEventListener('mousemove', this._resize, false);
    document.documentElement.addEventListener('mouseup', this._mouseUp, false);
  }

  private _mouseUp() {
    this.simulationStatusLoggerBody.style.userSelect = 'initial';
    window.getSelection().empty();
    document.documentElement.removeEventListener('mousemove', this._resize, false);
    document.documentElement.removeEventListener('mouseup', this._mouseUp, false);
  }

  private _resize(event) {
    const newPosition = Math.min(this._dragHandleMaxPosition, Math.max(event.clientY - 90, this._dragHandleMinPosition));
    this.setState({
      dragHandlePosition: newPosition
    });
  }
}