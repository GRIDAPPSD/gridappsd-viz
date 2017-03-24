import * as Backbone from 'backbone';

class Ieee8500TimeseriesModel extends Backbone.Model {

    private isPolling:boolean = false;

    constructor(props:any) {
        super(props);

        if (props) this.url = props.url;
    } 

    hasData():boolean {
        return this.get('timestamp') != undefined;
    }

    parse(response:any) {
        response.data.timestamp = new Date(response.data.timestamp);
        console.log(response);
        return response;
    }

    startPolling() {

        this.isPolling = true;
        this.poll();
    }

    poll() {

        if (this.isPolling) {
            
            this.fetch();
            let self = this;
            setTimeout(
                self.poll.bind(self),
                250
            )
        }
    }

    stopPolling() {
        this.isPolling = false;
    }
}

export default Ieee8500TimeseriesModel;