import * as Backbone from 'backbone';

/**
 * Holds timeseries values.
 * 
 * history
 * curTime
 */
class Ieee8500TimeseriesModel extends Backbone.Model {

    constructor(props:any) {
        super(props);

        if (props) this.url = props.url;
    } 

    hasData():boolean {
        return this.get('curTime') != undefined;
    }

    parse(response:any) {
        response.data.timestamp = new Date(Date.now());

        // Wrap the response to differentiate it from the history
        return {
            curTime: response
        };
    }
}

export default Ieee8500TimeseriesModel;