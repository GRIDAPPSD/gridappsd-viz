import * as Backbone from 'backbone';
import * as d3 from 'd3';

import IPlotDatum from './IPlotDatum';
import PlotSeriesModel from './PlotSeriesModel';
import PlotSeriesCollection from './PlotSeriesCollection';

class PlotModel extends Backbone.Model {

    private _maxNumItems = 20;

    get name():string {
        return this.get('name');
    }

    set name(name:string) {
        this.set('name', name);
    }

    get seriesCollection():PlotSeriesCollection {
        return this.get('seriesCollection');
    }

    constructor() {
        super();

        this.set('seriesCollection', new PlotSeriesCollection());
    }

    addData(seriesName:string, datum:any, triggerChange?:boolean) {

        let existingData = this.seriesCollection.getSeries(seriesName).data;
        if (existingData.length >= this._maxNumItems) {
            existingData.shift();
        } 
        existingData.push(datum);
        if (triggerChange) this.trigger('change:data');
    }

    getXDomain():number[] {
        return this.getDomain((datum:IPlotDatum) => datum.xRaw);
    }

    getYDomain():number[] {
        return this.getDomain((datum:IPlotDatum) => datum.yRaw);
    }

    getDomain(accessor:(datum:IPlotDatum) => number):number[] {
        
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        this.seriesCollection.models.forEach((series) => {
            let extent = d3.extent(series.data, accessor);
            if (extent[0] < min) {
                min = extent[0];
            }
            if (extent[1] > max) {
                max = extent[1];
            }
        })
        return [min, max];
    }
}

export default PlotModel;