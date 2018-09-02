import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class TransformWatcherService {
  private static readonly _INSTANCE_ = new TransformWatcherService();

  private readonly _watcher = new Subject<void>();

  private constructor() {
  }

  static getInstance() {
    return TransformWatcherService._INSTANCE_;
  }

  notify() {
    this._watcher.next();
  }

  changed(): Observable<void> {
    return this._watcher.asObservable()
      .pipe(debounceTime(500));
  }

}