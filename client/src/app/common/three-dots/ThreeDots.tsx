import { Component } from 'react';
import { timer, Subscription } from 'rxjs';

import './ThreeDots.light.scss';
import './ThreeDots.dark.scss';

interface Props {
}

interface State {
  dots: number;
}

export class ThreeDots extends Component<Props, State> {

  private _subscription: Subscription;
  private _direction: 1 | -1 = 1;

  constructor(props: Props) {
    super(props);
    this.state = {
      dots: 0
    };
  }

  componentDidMount() {
    this._subscription = timer(0, 1000)
      .subscribe({
        next: () => {
          this.setState(state => {
            if (state.dots === 3) {
              this._direction = -1;
            } else if (state.dots === 0) {
              this._direction = 1;
            }
            return {
              dots: state.dots + this._direction
            };
          });
        }
      });
  }

  componentWillUnmount() {
    this._subscription.unsubscribe();
  }

  render() {
    return (
      <span className='three-dots'>
        {'.'.repeat(this.state.dots)}
      </span>
    );
  }

}
