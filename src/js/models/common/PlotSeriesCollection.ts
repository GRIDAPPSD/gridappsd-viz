import * as Backbone from 'backbone';

import PlotSeriesModel from './PlotSeriesModel';
import IPlotDatum from './IPlotDatum';

/**
 * A collection of plot series.
 */
class PlotSeriesCollection extends Backbone.Collection<PlotSeriesModel> {

    private _seriesModelsByName:any = { };

    addSeries(name:string, topologyElementName:string, data:IPlotDatum[]) {

        let model = new PlotSeriesModel();
        model.name = name;
        model.data = data;
        model.topologyElementName = topologyElementName;

        this._seriesModelsByName[name] = model;

        this.add(model);
    }

    getSeries(name:string):PlotSeriesModel {
        return this._seriesModelsByName[name];
    }
}

export default PlotSeriesCollection;