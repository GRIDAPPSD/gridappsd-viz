import * as Backbone from 'backbone';

import Ieee8500StaticModel from './Ieee8500StaticModel';
import Ieee8500TimeseriesModel from './Ieee8500TimeseriesModel';
import Ieee8500MessageModel from './Ieee8500MessageModel';
import PlotModel from '../common/PlotModel';

class Ieee8500MainModel extends Backbone.Model {

    private _plotModelsByPlotName:any;

    get staticModel():Ieee8500StaticModel {
        return this.get('staticModel');
    }

    get timeseriesModel():Ieee8500TimeseriesModel {
        return this.get('timeseriesModel');
    }

    get messageModel():Ieee8500MessageModel {
        return this.get('messageModel');
    }

    get plotModelsByName():any {
        return this._plotModelsByPlotName;
    }

    constructor() {

        super();

        this.set('staticModel', new Ieee8500StaticModel({url: '/data/ieee8500'}));
        this.set('messageModel', new Ieee8500MessageModel({url: '/data/ieee8500'}));
        this.set('timeseriesModel', new Ieee8500TimeseriesModel({url: '/data/ieee8500/timeseries'}));

        this.staticModel.on('change', this.onStaticModelChange, this);
    }

    hasData():boolean {

        return this.staticModel.hasData();
    }

    private onStaticModelChange() {

        // We'll get the static model once. Don't even listen to timeseries events 
        // until we have received the static model.
        this.timeseriesModel.on('change', this.onTimeseriesChange, this);
        this.trigger('change:staticModel');
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
        let mapping = this.staticModel.get('timeseriesToPlotSeriesMapping');
        let topologyMapping = this.staticModel.get('timeseriesToTopologyMapping');
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

        // Handle null data from FNCS.
        if (curTime.data.output == null) return;

        let mapping = this.staticModel.get('timeseriesToPlotSeriesMapping');
        Object.keys(mapping).forEach((plotName:string) => {
            
            let plotModel:PlotModel = self.plotModelsByName[plotName];
            mapping[plotName].forEach((seriesName:string) => {
                let datum = curTime.data.output.ieee8500[seriesName];
                plotModel.addData(
                    seriesName, 
                    {xRaw: new Date(Date.now()), yRaw: self.getYRaw(plotName, datum)}, 
                    false)
            })
            plotModel.trigger('change:data');
        })
    }

    private getYRaw(plotName:string, datum:any) {
        if (plotName.indexOf('voltage') >= 0
            || plotName.indexOf('power_in') >= 0) { 
            // Use a regex to parse a string like this:
            // voltage: 6319.15-4782.82j V
            // power_in: 1.75641e+06-808539j VA
            // In Node, the same regex works for with e+06 and without. 
            // For some reason, in Chrome, it doesn't. Using separate regexes for now.
            let valueString = datum[plotName];
            let regex = /[+|-]?(\d+\.?\d+?e?[+|-]?\d+?)[+|-](\d+\.?\d+?)j V/; // TODO: doens't handle imaginary numbers with e+06, etc.
            if (valueString.indexOf('e') < 0) {
                regex = /[+|-]?(\d+\.?\d+?)[+|-](\d+\.?\d+?)j V/;
            }
            let matches = valueString.match(regex);
            let real = Number(matches[1]);
            let imag = Number(matches[2]);

            // TODO: This is not really a per-unit voltage. I don't know 
            // what the nominal voltage would be.
            // How does the team want to combine these values into a single
            // stat to display in the plot? 
            // Or do they want to choose real or imaginary?
            return Math.sqrt(Math.pow(real, 2) + Math.pow(imag, 2));
        } else {
            return Number(datum[plotName]);
        }
    }
}

export default Ieee8500MainModel;