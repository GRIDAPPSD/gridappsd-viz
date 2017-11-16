import * as Backbone from 'backbone';

/**
 * Holds simulation status message values.
 * 
 * msg
 */
class Ieee8500MessageModel extends Backbone.Model {

    constructor(props:any) {
        super(props);

        if (props) this.url = props.url;
    } 

    hasMessage():boolean {
        return this.get('msg') != undefined;
    }

}

export default Ieee8500MessageModel;