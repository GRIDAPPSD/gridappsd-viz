import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Overlay } from './Overlay';

export class OverlayService {

  private static readonly _INSTANCE = new OverlayService();
  private _currentOverlay: HTMLElement;


  private constructor() {
    this.hide = this.hide.bind(this);
  }

  static getInstance() {
    return OverlayService._INSTANCE;
  }

  show(element: React.ReactElement<any>, showBackdrop = false) {
    this._currentOverlay = document.createElement('div');
    document.body.appendChild(this._currentOverlay);
    ReactDOM.render(<Overlay element={element} showBackdrop={showBackdrop} />, this._currentOverlay);
  }

  hide(animate = true) {
    if (animate) {
      this._currentOverlay.classList.add('fade-out');
      setTimeout(() => {
        ReactDOM.unmountComponentAtNode(this._currentOverlay);
        this._currentOverlay.parentElement.removeChild(this._currentOverlay);
      }, 1000);
    }
    else {
      ReactDOM.unmountComponentAtNode(this._currentOverlay);
      this._currentOverlay.parentElement.removeChild(this._currentOverlay);
    }
  }

}
