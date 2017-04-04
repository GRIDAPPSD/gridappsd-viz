import Ieee8500MainModel from '../../models/ieee8500/Ieee8500MainModel';

class Ieee8500Controller {

    private _ieee8500MainModel:Ieee8500MainModel = new Ieee8500MainModel();
    private _isPolling:boolean = false;
    private _pollInterval:number = 250;

    get model():Ieee8500MainModel {
        return this._ieee8500MainModel;
    }

    contructor() {
        
    }

    /**
     * Starts polling for timeseries data.
     */
    startPolling() {

        this._isPolling = true;
        this.poll();
    }

    poll() {

        if (this._isPolling) {

            this._ieee8500MainModel.timeseriesModel.fetch();
            let self = this;
            setTimeout (
                self.poll.bind(this),
                self._pollInterval
            )
        }
    }

    stopPolling() {
        this._isPolling = false;
    }
}

export default Ieee8500Controller;