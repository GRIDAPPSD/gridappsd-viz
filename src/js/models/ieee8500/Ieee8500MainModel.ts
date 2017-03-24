import * as Backbone from 'backbone';

import Ieee8500StaticModel from './Ieee8500StaticModel';
import Ieee8500TimeseriesModel from './Ieee8500TimeseriesModel';

class Ieee8500MainModel extends Backbone.Model {

    private _staticModel:Ieee8500StaticModel;
    private _timeseriesModel:Ieee8500TimeseriesModel;

    get staticModel():Ieee8500StaticModel {
        return this._staticModel;
    }

    get timeseriesModel():Ieee8500TimeseriesModel {
        return this._timeseriesModel;
    }

    constructor() {

        super();

        this._staticModel = new Ieee8500StaticModel({url: '/data/ieee8500'});
        this._timeseriesModel = new Ieee8500TimeseriesModel({url: '/data/ieee8500/timeseries'});

        this.staticModel.on('change', this.triggerChange, this);
        this.timeseriesModel.on('change', this.triggerChange, this);
    }

    hasData():boolean {

        return this.staticModel.hasData();
    }

    private triggerChange() {
        console.log('change!!');
        this.trigger('change');
    }
}

export default Ieee8500MainModel;