import * as Backbone from 'backbone';

class Ieee8500MainModel extends Backbone.Model {

    constructor(props: any) {
        super(props);

        if (props.url) this.url = props.url;
    }

    hasData():boolean {

        return this.get('elements') != undefined;
    }
}

export default Ieee8500MainModel;