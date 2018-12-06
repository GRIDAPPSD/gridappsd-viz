import * as React from 'react';
import { Subscription } from 'rxjs';

import { Tooltip } from '../../../../shared/views/tooltip/Tooltip';
import { TransformWatcherService } from '../../../../services/TransformWatcherService';

import './Label.scss';

interface Props {
  nodeNameToAttachTo: string;
  content: any;
}

interface State {
}

export class Label extends React.Component<Props, State> {
  private readonly _transformWatcherService = TransformWatcherService.getInstance();
  private _tooltip: Tooltip;
  private _anchorNodeTransformWatcher: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    this._show();
    this._repositionLabel();
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props !== newProps) {
      const previousTooltip = this._tooltip;
      this._show();
      setTimeout(() => {
        if (previousTooltip)
          previousTooltip.hide();
      }, 300);
    }
  }

  componentWillUnmount() {
    this._hide();
    this._anchorNodeTransformWatcher.unsubscribe();
  }

  render() {
    return null;
  }

  private _repositionLabel() {
    this._anchorNodeTransformWatcher = this._transformWatcherService.changed()
      .subscribe(() => {
        this._hide();
        this._show();
      });
  }

  private _hide() {
    if (this._tooltip) {
      this._tooltip.hide();
      this._tooltip = null;
    }
  }

  private _show() {
    const anchor = ['', 'a', 'b', 'c'].map(phase => document.querySelector(`.model-renderer ._${this.props.nodeNameToAttachTo}${phase}_`) as HTMLElement)
      .filter(element => element)[0];
    if (anchor) {
      const content = <>
        <header className='label__heading'>{this.props.nodeNameToAttachTo}</header>
        {this.props.content}
      </>;
      this._tooltip = new Tooltip({ position: 'bottom', content });
      const labelContainer = document.createElement('div');
      labelContainer.className = 'label-container';
      document.body.appendChild(labelContainer);
      this._tooltip.showAt(anchor, labelContainer);
    }
  }

}