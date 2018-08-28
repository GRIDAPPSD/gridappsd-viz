import * as React from 'react';

import * as ReactDOM from 'react-dom';
import { Overlay } from './Overlay';

export class OverlayService {

  private static readonly _INSTANCE = new OverlayService();
  private _currentOverlay: HTMLElement;


  private constructor() {
    this._remove = this._remove.bind(this);
  }

  static getInstance() {
    return OverlayService._INSTANCE;
  }

  show(element: React.ReactElement<any>) {
    this._currentOverlay = document.createElement('div');
    this._currentOverlay.addEventListener('animationend', this._remove, false);
    document.body.appendChild(this._currentOverlay);
    ReactDOM.render(<Overlay element={element} />, this._currentOverlay);
  }

  hide() {
    this._currentOverlay.classList.add('fade-out');
  }

  private _remove() {
    if (this._currentOverlay.classList.contains('fade-out')) {
      ReactDOM.unmountComponentAtNode(this._currentOverlay);
      this._currentOverlay.removeEventListener('animationend', this._remove, false);
      this._currentOverlay.parentElement.removeChild(this._currentOverlay);
    }

  }

}