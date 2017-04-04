import * as React from 'react';
import * as Backbone from 'backbone';

import IHasModel from '../interfaces/IHasModel';

export interface ControlledReactComponentProps<C extends IHasModel> {controller: C};

/**
 * A React component with a model and a controller in props.
 * 
 * Note: I tried to combine this with BackboneReactComponent, but the parameterized classes
 * were getting confusing.
 */
export class ControlledReactComponent<C extends IHasModel, S> extends React.Component<ControlledReactComponentProps<C>, S> {    

    componentDidMount() {
        this.props.controller.model.on('change', this.forceUpdate.bind(this, null), this);
    }

    componentWillUnmount() {
        this.props.controller.model.off('change', null, this);
    }
}