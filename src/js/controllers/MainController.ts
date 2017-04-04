import Ieee8500Controller from './ieee8500/Ieee8500Controller';

class MainController {

    private _ieee8500Controller:Ieee8500Controller = new Ieee8500Controller();

    get ieee8500Controller():Ieee8500Controller {
        return this._ieee8500Controller;
    }
}

export default MainController;