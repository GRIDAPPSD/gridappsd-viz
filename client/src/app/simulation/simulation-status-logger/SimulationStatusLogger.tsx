import { Component, createRef } from 'react';

import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { Tooltip } from '@client:common/tooltip';
import { IconButton } from '@client:common/buttons';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { Paginator, PageChangeEvent } from '@client:common/paginator';

import { Deque } from './models/Deque';
import { LogMessage } from './models/LogMessage';
import { SimulationStatusLoggerMessage } from './SimulationStatusLoggerMessage';

import './SimulationStatusLogger.light.scss';
import './SimulationStatusLogger.dark.scss';

interface Props {
  visibleLogMessageDeque: Deque<LogMessage>;
  totalLogMessageCount: number;
  showProgressIndicator: boolean;
  onLoadMoreLogMessages: (start: number, count: number) => void;
}

interface State {
  dragHandlePosition: number;
  showLogMessages: boolean;
}

const numberOfMessagesToShow = 30;
const dragHandleMinPosition = 30;
const dragHandleDefaultPosition = 430;
const dragHandleMaxPosition = (document.body.clientHeight || document.documentElement.clientHeight) - 110;
export class SimulationStatusLogger extends Component<Props, State> {

  readonly logMessageContainerRef = createRef<HTMLElement>();
  readonly logMessageTemporaryContainer = {
    length: 0,
    slice() {
      return null;
    }
  } as Array<LogMessage>;

  private _logMessageSearchStart = numberOfMessagesToShow;

  constructor(props: Props) {
    super(props);

    this.state = {
      dragHandlePosition: dragHandleMaxPosition,
      showLogMessages: true
    };

    this.toggleLogMessageVisibility = this.toggleLogMessageVisibility.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._resize = this._resize.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (this.props.totalLogMessageCount !== nextProps.totalLogMessageCount) {
      this.logMessageTemporaryContainer.length = this.props.totalLogMessageCount;
    }
    // If logs are currently hidden, we want to update iff the drag position changes
    if (!nextState.showLogMessages) {
      return this.state.dragHandlePosition !== nextState.dragHandlePosition;
    }
    return true;
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.showProgressIndicator !== this.props.showProgressIndicator && this.props.showProgressIndicator) {
      this.setState({
        dragHandlePosition: dragHandleDefaultPosition
      });
    }
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
            onMouseDown={this.mouseDown}
            style={{visibility: this.props.visibleLogMessageDeque.size() > 0 ? 'visible' : 'hidden'}}
          >
            Simulation Status
            <Tooltip content={this.state.showLogMessages ? 'Hide logs' : 'Show logs'}>
              <IconButton
                hasBackground={false}
                className='simulation-status-logger__header__label__toggle-log-message-visiblity'
                icon={this.state.showLogMessages ? 'visibility_off' : 'visibility'}
                size='small'
                onClick={this.toggleLogMessageVisibility} />
            </Tooltip>
          </span>
          <div
            className='simulation-status-logger__header__legends'
            style={{
              visibility: this.props.visibleLogMessageDeque.size() > 0 ? 'visible' : 'hidden'
            }}>
            <div className='simulation-status-logger__header__legends__level FATAL'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>FATAL</span>
            </div>
            <div className='simulation-status-logger__header__legends__level ERROR'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>ERROR</span>
            </div>
            <div className='simulation-status-logger__header__legends__level WARN'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>WARN</span>
            </div>
            <div className='simulation-status-logger__header__legends__level INFO'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>INFO</span>
            </div>
            <div className='simulation-status-logger__header__legends__level DEBUG'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>DEBUG</span>
            </div>
            <div className='simulation-status-logger__header__legends__level TRACE'>
              <span className='simulation-status-logger__header__legends__level__color' />
              <span className='simulation-status-logger__header__legends__level__label'>TRACE</span>
            </div>
          </div>
        </header>
        <section
          className='simulation-status-logger__body'
          style={{visibility: this.props.visibleLogMessageDeque.size() > 0 ? 'visible' : 'hidden'}}
        >
          <div
            className='simulation-status-logger__body-wrapper'
            style={{ display: this.state.showLogMessages ? 'flex' : 'none' }}>
            <section
              ref={this.logMessageContainerRef}
              className='simulation-status-logger__body__message-container'>
              {
                this.props.visibleLogMessageDeque.toArray(message => (
                  <SimulationStatusLoggerMessage
                    key={message.id}
                    message={message.content} />
                ))
              }
            </section>
            {
              this.props.totalLogMessageCount > 0
              &&
              <Paginator
                items={this.logMessageTemporaryContainer}
                pageSize={numberOfMessagesToShow}
                onPageChange={this.onPageChange} />
            }
          </div>
          {
            !this.state.showLogMessages
            &&
            <MessageBanner>
              Logs are turned off
            </MessageBanner>
          }
        </section>
        <ProgressIndicator show={this.props.showProgressIndicator} />
      </div >
    );
  }

  toggleLogMessageVisibility() {
    if (this.state.showLogMessages) {
      this.setState({
        showLogMessages: false,
        dragHandlePosition: dragHandleMaxPosition
      });
    } else {
      this.setState(state => ({
        showLogMessages: true,
        dragHandlePosition: state.dragHandlePosition !== dragHandleMaxPosition
          ? state.dragHandlePosition
          : dragHandleDefaultPosition
      }));
    }
  }

  mouseDown() {
    document.body.classList.add('dragging');
    document.documentElement.addEventListener('mousemove', this._resize, false);
    document.documentElement.addEventListener('mouseup', this._mouseUp, false);
  }

  private _mouseUp() {
    document.body.classList.remove('dragging');
    window.getSelection().empty();
    document.documentElement.removeEventListener('mousemove', this._resize, false);
    document.documentElement.removeEventListener('mouseup', this._mouseUp, false);
  }

  private _resize(event: MouseEvent) {
    const newPosition = Math.min(dragHandleMaxPosition, Math.max(event.clientY - 90, dragHandleMinPosition));
    this.setState({
      dragHandlePosition: newPosition
    });
  }

  onPageChange(event: PageChangeEvent<LogMessage>) {
    if (event.start !== this._logMessageSearchStart) {
      this._logMessageSearchStart = event.start;
      this.props.onLoadMoreLogMessages(this.props.totalLogMessageCount - event.start, event.count);
      this._restoreMessageContainerScrollTop(1000);
    }
  }

  private _restoreMessageContainerScrollTop(duration: number) {
    const messageContainer = this.logMessageContainerRef.current;
    let start: DOMHighResTimeStamp;
    let scrollTop = this.logMessageContainerRef.current.scrollTop;

    function step(timestamp: DOMHighResTimeStamp) {
      if (start === undefined) {
        start = timestamp;
        window.requestAnimationFrame(step);
      } else {
        const t = Math.min(1, (timestamp - start) / duration);
        scrollTop *= (1 - t);
        messageContainer.scrollTop = scrollTop;
        if (t < 1) {
          window.requestAnimationFrame(step);
        }
      }
    }
    window.requestAnimationFrame(step);
  }

}
