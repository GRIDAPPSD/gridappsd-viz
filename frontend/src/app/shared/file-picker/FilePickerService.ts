import { Subject, Observable, fromEvent, of } from 'rxjs';

import { switchMap, map, take } from 'rxjs/operators';

export class FilePickerService {

  private static readonly _INSTANCE = new FilePickerService();

  private _fileSelection = new Subject<File>();

  static getInstance() {
    return FilePickerService._INSTANCE;
  }

  constructor() {
  }

  selectFile(file: File) {
    this._fileSelection.next(file);
  }

  clearSelection() {
    (document.querySelector('.file-picker') as HTMLFormElement).reset();
  }

  open(): FilePickerService {
    const filePicker = document.querySelector('.file-picker__input') as HTMLInputElement;
    filePicker.click();
    return this;
  }

  readFileAsJson<T = any>(): Observable<T> {
    return this._fileSelection.asObservable()
      .pipe(
        switchMap(file => {
          if (file) {
            const fileReader = new FileReader();
            const fileReaderResultObservable = fromEvent(fileReader, 'load')
              .pipe(map(() => JSON.parse(fileReader.result as string) as T));
            fileReader.readAsText(file);
            return fileReaderResultObservable;
          }
          return of(null);
        }),
        take(1)
      );
  }


}
