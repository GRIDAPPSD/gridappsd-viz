import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take, pluck } from 'rxjs/operators';

export interface Configurations {
  version: string;
  host: string;
  // Old format doesn't have "port" property
  port?: string;
}

export class ConfigurationManager {

  private static readonly _INSTANCE_ = new ConfigurationManager();

  private _configurationChanges = new BehaviorSubject<Configurations>(null);

  static getInstance() {
    return ConfigurationManager._INSTANCE_;
  }

  private constructor() {
    this._fetchConfigurations();
  }

  private _fetchConfigurations() {
    fetch('/config.json')
      .then<Configurations>(response => response.json())
      .then(payload => {
        this._configurationChanges.next(payload);
      });
  }

  configurationChanges<K extends keyof Configurations>(key: K): Observable<Configurations[K]> {
    return this._configurationChanges.asObservable()
      .pipe(
        filter(configurations => configurations !== null),
        take(1),
        pluck(key)
      );
  }

}
