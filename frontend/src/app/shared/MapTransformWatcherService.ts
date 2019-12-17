import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class MapTransformWatcherService {

  private static readonly _INSTANCE_ = new MapTransformWatcherService();

  private readonly _watcher = new Subject<void>();

  private constructor() {
  }

  static getInstance() {
    return MapTransformWatcherService._INSTANCE_;
  }

  notify() {
    this._watcher.next();
  }

  observe(): Observable<void> {
    return this._watcher.asObservable()
      .pipe(debounceTime(500));
  }

}
