import * as React from 'react';
import { Subscription } from 'rxjs';

import { MapTransformWatcherService } from '@shared/MapTransformWatcherService';

import './SimulationLabel.scss';

interface Props {
  nodeNameToAttachTo: string;
}

interface State {
  left: number;
  top: number;
}

export class SimulationLabel extends React.Component<Props, State> {

  simulationLabel: HTMLDivElement;

  private readonly _transformWatcherService = MapTransformWatcherService.getInstance();
  private _anchorNodeTransformWatcher: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      left: 0,
      top: 0
    };

  }

  componentDidMount() {
    this._repositionLabelWhenMapIsTransformed();
    this.setState(this._calculateAnchorPosition());
  }

  private _repositionLabelWhenMapIsTransformed() {
    this._anchorNodeTransformWatcher = this._transformWatcherService.observe()
      .subscribe(() => {
        this.setState(this._calculateAnchorPosition());
      });
  }

  private _calculateAnchorPosition(): { left: number; top: number; } {
    for (const phase of ['', 'a', 'b', 'c']) {
      const anchor = document.querySelector(`.model-renderer ._${this.props.nodeNameToAttachTo}${phase}_`);
      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const offsetParentOfLabel = this.simulationLabel.offsetParent as HTMLElement;
        const toolBarHeight = 60;
        return {
          left: anchorRect.left + anchorRect.width / 2,
          top: anchorRect.top - offsetParentOfLabel.offsetTop - toolBarHeight + anchorRect.height / 2
        };
      }
    }
    return {
      left: 0,
      top: 0
    };
  }

  componentWillUnmount() {
    this._anchorNodeTransformWatcher.unsubscribe();
  }

  render() {
    return (
      <div
        ref={ref => this.simulationLabel = ref}
        className='simulation-label'
        style={this.state}>
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
