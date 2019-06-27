import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export interface Configurations {
  version: string;
  host: string;
}

export class ConfigurationManager {

  private static readonly _INSTANCE = new ConfigurationManager();

  private _configurationChanges = new BehaviorSubject<Configurations>(null);

  private constructor() {
    this._fetchConfigurations();
  }

  private _fetchConfigurations() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/config.json');
    xhr.onload = event => {
      this._configurationChanges.next(JSON.parse((event.target as XMLHttpRequest).responseText));
    };
    xhr.send();
  }

  static getInstance() {
    return ConfigurationManager._INSTANCE;
  }

  configurationChanges() {
    return this._configurationChanges.asObservable()
      .pipe(
        filter(configurations => configurations !== null),
        take(1)
      );
  }

}
