import { Subject, Observable } from 'rxjs';
import { select, zoom, Selection, zoomIdentity, ZoomTransform, zoomTransform, D3ZoomEvent } from 'd3';

export class CanvasTransformService {

  private static readonly _INSTANCE_ = new CanvasTransformService();

  private readonly _notifier = new Subject<ZoomTransform>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _zoomer = zoom<SVGElement, any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _svgSelection: Selection<SVGElement, any, any, any>;
  private _currentTransform: ZoomTransform;

  private constructor() {
    this.reset = this.reset.bind(this);
  }

  static getInstance() {
    return CanvasTransformService._INSTANCE_;
  }

  bindToSvgCanvas(svg: SVGSVGElement) {
    this._svgSelection = select(svg);
    this._svgSelection.call(this._zoomer);
    this._currentTransform = zoomTransform(svg);
    this._zoomer.on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
      this._currentTransform = event.transform;
      this._notifier.next(this._currentTransform);
    });
    return this._svgSelection;
  }

  onTransformed(): Observable<ZoomTransform> {
    return this._notifier.asObservable();
  }

  /**
   * Reset all transformations (scaling, translating)
   */
  reset() {
    this._currentTransform = zoomIdentity;
    this._zoomer.transform(this._svgSelection.transition(), this._currentTransform);
  }

  setZoomLevel(zoomLevel: number) {
    this._currentTransform = this._currentTransform.scale((1 / this._currentTransform.k) * zoomLevel);
    this._zoomer.transform(this._svgSelection, this._currentTransform);
  }

  zoomToPosition(left: number, top: number) {
    return new Promise<void>(resolve => {
      const currentZoomLevel = this._currentTransform.k;
      // Reset the zoom level to 1
      this._currentTransform = this._currentTransform.scale(1 / currentZoomLevel);
      const svg = this._svgSelection.node();
      const canvasBoundingBox = svg.getBoundingClientRect();
      const centerX = (canvasBoundingBox.left + (svg.clientWidth / 2)) - left;
      const centerY = (canvasBoundingBox.top + (svg.clientHeight / 2)) - top;

      this._currentTransform = this._currentTransform.translate(centerX, centerY);
      this._currentTransform = this._currentTransform.scale(currentZoomLevel);
      const transformTransition = this._svgSelection.transition().on('end', resolve);
      this._zoomer.transform(transformTransition, this._currentTransform);
    });
  }

  getCurrentZoomLevel() {
    return this._currentTransform.k;
  }

}
