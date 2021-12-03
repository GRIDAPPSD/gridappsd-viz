import { Children, Component } from 'react';
import { findDOMNode } from 'react-dom';

import './Fade.light.scss';
import './Fade.dark.scss';

interface Props {
  in: boolean;
}

interface State {
}

/**
 * Describe a fading-in/fading-out animation. Example usage
 *
 * ```
 *    <Fade in={someBooleanState}>
 *        <SomeComponent>
 *        </SomeComponent>
 *    </Fade>
 * ```
 */
export class Fade extends Component<Props, State> {

  // The child component's first DOM element to apply the animation to
  private _element: HTMLElement;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    if (Children.count(this.props.children) !== 1) {
      throw new Error('<Fade /> component can only accept one child component with an enclosing DOM element');
    }
    // eslint-disable-next-line react/no-find-dom-node
    this._element = findDOMNode(this) as HTMLElement;
    if (this.props.in) {
      this._element.classList.add('fade-in');
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      if (this.props.in) {
        this._element.classList.remove('fade-out');
        this._element.classList.add('fade-in');
      } else {
        this._element.classList.remove('fade-in');
        this._element.classList.add('fade-out');
      }
    }
  }

  render() {
    return (
      this.props.children
    );
  }

}
