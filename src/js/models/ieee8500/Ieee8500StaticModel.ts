import * as Backbone from 'backbone';

class Ieee8500StaticModel extends Backbone.Model {

    constructor(props:any) {
        super(props);

        if (props) this.url = props.url;
    }

    parse(data:any) {
        console.log(data);
        return data;
    }

    hasData():boolean {
        return this.get('topology') != undefined;
    }
}

export default Ieee8500StaticModel;