import { Subject, Observable, fromEvent, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

export class FilePickerService {

  private static readonly _INSTANCE_ = new FilePickerService();

  private _fileSelection = new Subject<File>();

  static getInstance() {
    return FilePickerService._INSTANCE_;
  }

  private constructor() {
  }

  selectFile(file: File) {
    this._fileSelection.next(file);
  }

  fileSelectionChanges() {
    return this._fileSelection.asObservable();
  }

  clearSelection() {
    (document.querySelector('.file-picker') as HTMLFormElement).reset();
  }

  open(): FilePickerService {
    const filePicker = document.querySelector('.file-picker__input') as HTMLInputElement;
    filePicker.click();
    return this;
  }

  readFileAsJson<T>(): Observable<T> {
    return this._fileSelection.asObservable()
      .pipe(
        switchMap(file => {
          if (file) {
            const fileReader = new FileReader();
            const fileReaderResultObservable = fromEvent(fileReader, 'load')
              .pipe(switchMap(() => {
                try {
                  return of(JSON.parse(fileReader.result as string) as T);
                } catch (e) {
                  return throwError(e.message);
                }
              }));
            fileReader.readAsText(file);
            return fileReaderResultObservable;
          }
          return of(null);
        }),
        take(1)
      );
  }

}
