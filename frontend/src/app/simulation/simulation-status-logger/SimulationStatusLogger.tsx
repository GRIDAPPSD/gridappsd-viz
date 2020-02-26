import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

import { SimulationStatusLoggerMessage } from './SimulationStatusLoggerMessage';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';
import { LogMessage } from './models/LogMessage';

import './SimulationStatusLogger.light.scss';
import './SimulationStatusLogger.dark.scss';

interface Props {
  messages: LogMessage[];
  isFetching: boolean;
}

interface State {
  dragHandlePosition: number;
  visibleMessages: LogMessage[];
}

const numberOfMessagesToLoadNext = 30;
const logLevels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

export class SimulationStatusLogger extends React.Component<Props, State> {

  readonly simulationStatusLoggerBodyRef = React.createRef<HTMLElement>();

  private readonly _dragHandleMinPosition = 30;
  private readonly _dragHandleMaxPosition = document.body.clientHeight - 110;
  private readonly _loggerBodyScrollNotifier = new Subject<number>();

  constructor(props: Props) {
    super(props);
    this.state = {
      dragHandlePosition: this._dragHandleMaxPosition,
      visibleMessages: []
    };
    this.mouseDown = this.mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._resize = this._resize.bind(this);
    this.loadMoreMessages = this.loadMoreMessages.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps !== this.props) {
      if (this.props.isFetching) {
        this.setState({
          dragHandlePosition: 430
        });
      }
      if (this.props.messages !== prevProps.messages) {
        const currentNumberOfVisibleMessages = this.state.visibleMessages.length;
        if (currentNumberOfVisibleMessages <= numberOfMessagesToLoadNext) {
          this.setState({
            visibleMessages: this.props.messages.slice(0, numberOfMessagesToLoadNext)
          });
        } else {
          this.setState({
            visibleMessages: this.props.messages.slice(0, currentNumberOfVisibleMessages)
          });
        }
      }
    }
  }

  componentDidMount() {
    this._loggerBodyScrollNotifier.pipe(
      debounceTime(250),
      filter(
        scrollTop => scrollTop === this.simulationStatusLoggerBodyRef.current.scrollHeight - this.simulationStatusLoggerBodyRef.current.clientHeight
      )
    )
      .subscribe({
        next: scrollTop => {
          // When the user scrolls to the bottom of the messages body
          // then just keep appending ${messageBatchToShowNext} more messages until there is no more
          if (this.state.visibleMessages.length < this.props.messages.length) {
            this.setState({
              visibleMessages: this.props.messages.slice(0, this.state.visibleMessages.length + numberOfMessagesToLoadNext)
            });
            // Move the scroll bar up to the previous scroll top position so that it does not just keep
            // sticking to the bottom and causes the messages to keep getting appended
            this.simulationStatusLoggerBodyRef.current.scrollTop = scrollTop;
          }
        }
      });
  }

  componentWillUnmount() {
    this._loggerBodyScrollNotifier.complete();
  }

  render() {
    return (
      <div
        className='simulation-status-logger'
        style={{
          top: `${this.state.dragHandlePosition}px`
        }}>
        <header className='simulation-status-logger__header'>
          <span
            className='simulation-status-logger__header__label'
            onMouseDown={this.mouseDown}>
            Simulation Status
          </span>
          {
            this.props.messages.length > 0
            &&
            <div className='simulation-status-logger__header__legends'>
              {
                logLevels.map(logLevel => (
                  <div
                    key={logLevel}
                    className='simulation-status-logger__header__legends__level'>
                    <span className={`simulation-status-logger__header__legends__level__color ${logLevel}`} />
                    <span className='simulation-status-logger__header__legends__level__label'>
                      {logLevel}
                    </span>
                  </div>
                ))
              }
            </div>
          }
        </header>
        <section
          className='simulation-status-logger__body'
          ref={this.simulationStatusLoggerBodyRef}
          onScroll={this.loadMoreMessages}>
          {
            this.state.visibleMessages.map(message => (
              <SimulationStatusLoggerMessage key={message.id} message={message.content} />
            ))
          }
        </section>
        <ProgressIndicator show={this.props.isFetching} />
      </div>
    );
  }

  mouseDown() {
    this.simulationStatusLoggerBodyRef.current.style.userSelect = 'none';
    document.documentElement.addEventListener('mousemove', this._resize, false);
    document.documentElement.addEventListener('mouseup', this._mouseUp, false);
  }

  private _mouseUp() {
    this.simulationStatusLoggerBodyRef.current.style.userSelect = 'initial';
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

  loadMoreMessages() {
    this._loggerBodyScrollNotifier.next(this.simulationStatusLoggerBodyRef.current.scrollTop);
  }

}
