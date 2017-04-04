import * as Backbone from 'backbone';

import IPlotDatum from './IPlotDatum';

/**
 * The Backbone model for a single plot series.
 * 
 * I really should stop using Backbone... 
 */
class PlotSeriesModel extends Backbone.Model {

    get name():string {
        return this.get('name');
    }

    get topologyElementName():string {
        return this.get('topologyElementName');
    }

    get data():IPlotDatum[] {
        return this.get('data');
    }

    set name(name:string) {
        this.set('name', name);
    }

    set topologyElementName(name:string) {
        this.set('topologyElementName', name);
    }

    set data(data:IPlotDatum[]) {
        this.set('data', data);
    }

    constructor() {
        super();
    }
}

export default PlotSeriesModel;