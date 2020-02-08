import * as React from 'react';
import { Subscription } from 'rxjs';

import { CanvasTransformService } from '@shared/CanvasTransformService';
import { waitUntil } from '@shared/misc';

import './SimulationLabel.light.scss';
import './SimulationLabel.dark.scss';

interface Props {
  nodeNameToAttachTo: string;
}

interface State {
  left: number;
  top: number;
}

export class SimulationLabel extends React.Component<Props, State> {

  simulationLabel: HTMLDivElement;

  private readonly _canvasTransformService = CanvasTransformService.getInstance();
  private _anchorNodeTransformWatcher: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      left: -1,
      top: -1
    };

  }

  componentDidMount() {
    waitUntil(() => {
      const labelPosition = this._calculateAnchorPosition();
      if (labelPosition.left !== -1) {
        this.setState(labelPosition);
      }
      return labelPosition.left !== -1;
    })
      .then(() => this._repositionLabelWhenMapIsTransformed());
  }

  private _calculateAnchorPosition(): { left: number; top: number; } {
    for (const phase of ['', 'a', 'b', 'c']) {
      const anchor = document.querySelector(`.topology-renderer ._${this.props.nodeNameToAttachTo}${phase}_`);
      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const offsetTopOfOffsetParent = this.simulationLabel.offsetParent
          ? this.simulationLabel.offsetParent.getBoundingClientRect().top
          : 0;
        return {
          left: anchorRect.left + anchorRect.width / 2,
          top: anchorRect.top - offsetTopOfOffsetParent
        };
      }
    }
    return {
      left: -1,
      top: -1
    };
  }

  private _repositionLabelWhenMapIsTransformed() {
    this._anchorNodeTransformWatcher = this._canvasTransformService.onTransformed()
      .subscribe(() => {
        this.setState(this._calculateAnchorPosition());
      });
  }

  componentWillUnmount() {
    this._anchorNodeTransformWatcher.unsubscribe();
  }

  render() {
    return (
      <div
        ref={ref => this.simulationLabel = ref}
        className='simulation-label'
        style={{
          left: this.state.left,
          top: this.state.top,
          visibility: this.state.left === -1 ? 'hidden' : 'visible'
        }}>
        <header className='simulation-label__heading'>
          {this.props.nodeNameToAttachTo}
        </header>
        <div className='simulation-label__content'>
          {this.props.children}
        </div>
      </div>
    );
  }

}
