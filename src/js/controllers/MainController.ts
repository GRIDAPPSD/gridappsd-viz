import Ieee8500Controller from './ieee8500/Ieee8500Controller';
import DataSource from '../interfaces/DataSource';

class MainController {

  private _ieee8500Controller: Ieee8500Controller;

  get ieee8500Controller(): Ieee8500Controller {
    return this._ieee8500Controller;
  }

  constructor(dataSource: DataSource) {
    this._ieee8500Controller = new Ieee8500Controller(dataSource);
  }
}

export default MainController;