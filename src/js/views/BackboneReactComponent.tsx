import * as React from 'react';
import * as Backbone from 'backbone';

export interface BackboneReactComponentProps<M extends Backbone.Model> {model: M};

export class BackboneReactComponent<M extends Backbone.Model, S> extends React.Component<BackboneReactComponentProps<M>, S> {    

    componentDidMount() {
        this.props.model.on('change', this.forceUpdate.bind(this, null), this);
    }

    componentWillUnmount() {
        this.props.model.off('change', null, this);
    }
}