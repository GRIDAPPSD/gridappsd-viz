import * as Backbone from 'backbone';

import Ieee8500StaticModel from './Ieee8500StaticModel';
import Ieee8500TimeseriesModel from './Ieee8500TimeseriesModel';
import PlotModel from '../common/PlotModel';

class Ieee8500MainModel extends Backbone.Model {

    private _plotModelsByPlotName:any;

    get staticModel():Ieee8500StaticModel {
        return this.get('staticModel');
    }

    get timeseriesModel():Ieee8500TimeseriesModel {
        return this.get('timeseriesModel');
    }

    get plotModelsByName():any {
        return this._plotModelsByPlotName;
    }

    constructor() {

        super();

        this.set('staticModel', new Ieee8500StaticModel({url: '/data/ieee8500'}));
        this.set('timeseriesModel', new Ieee8500TimeseriesModel({url: '/data/ieee8500/timeseries'}));

        this.staticModel.on('change', () => this.trigger('change:staticModel'), this);
        this.timeseriesModel.on('change', this.onTimeseriesChange, this);
    }

    hasData():boolean {

        return this.staticModel.hasData();
    }

    /**
     * When the time series model changes, update the plot models and 
     * trigger a change for the main model.
     */
    private onTimeseriesChange() {
        if (this._plotModelsByPlotName == undefined) {
            this.createPlotModels();
            this.trigger('change:plotModelsByName');
        } 
        this.updatePlotModels();
        this.trigger('change:timeseriesModel');
    }

    /**
     * Create models for each plot type specified in the data.
     * Add series to each plot model.
     */
    private createPlotModels() {

        this._plotModelsByPlotName = { };

        let self = this;
        let mapping = this.timeseriesModel.get('curTime').timeseriesToPlotSeriesMapping;
        let topologyMapping = this.timeseriesModel.get('curTime').timeseriesToTopologyMapping;
        console.log('mapping:');
        console.log(mapping);
        Object.keys(mapping).forEach((plotName) => {
            let plotModel = new PlotModel();
            plotModel.name = plotName;
            self.plotModelsByName[plotName] = plotModel;
            
            mapping[plotName].forEach((seriesName:string) => {
                plotModel.seriesCollection.addSeries(seriesName, topologyMapping[seriesName], []);
            });
        });     
    }

    /**
     * Push timeseries data onto each series array for each plot type.
     */
    private updatePlotModels() {

        let self = this;
        let curTime = this.timeseriesModel.get('curTime');
        let mapping = curTime.timeseriesToPlotSeriesMapping;
        Object.keys(mapping).forEach((plotName:string) => {
            
            let plotModel:PlotModel = self.plotModelsByName[plotName];
            mapping[plotName].forEach((seriesName:string) => {
                let datum = curTime.data[seriesName];
                plotModel.addData(
                    seriesName, 
                    {xRaw: new Date(datum.timestamp), yRaw: self.getYRaw(plotName, datum)}, 
                    false)
            })
            plotModel.trigger('change:data');
        })
    }

    private getYRaw(plotName:string, datum:any) {
        if (plotName.indexOf('voltage') >= 0
            || plotName.indexOf('power_in') >= 0) {
            let real = Number(datum[plotName + '.real']);
            let imag = Number(datum[plotName + '.imag']);
            return Math.sqrt(Math.pow(real, 2) + Math.pow(real, 2));
        } else {
            return Number(datum[plotName]);
        }
    }
}

export default Ieee8500MainModel;