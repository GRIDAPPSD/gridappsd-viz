import * as React from 'react';
// import * as Backbone from 'backbone';

import { BackboneReactComponent } from '../BackboneReactComponent';
import Ieee8500MainModel from '../../models/ieee8500/Ieee8500MainModel';
import PlotView from '../common/PlotView';

class Ieee8500PlotsView extends BackboneReactComponent<Ieee8500MainModel, {}> {

  componentWillMount() {
    this.props.model.on('change:plotModelsByName', this.forceUpdate.bind(this, null), this);
  }

  componentWillUnmount() {
    this.props.model.off('change:plotModelsByName', null, this);
  }

  render() {

    let self = this;
    if (!this.props.model.timeseriesModel.hasData() || !this.props.model.plotModelsByName) {
      return <div className="plots-view"></div>
    }

    return <div className="plots-view">
      {
        Object.keys(this.props.model.plotModelsByName).map((plotName) => {
          return <PlotView key={plotName} model={self.props.model.plotModelsByName[plotName]} />
        })
      }
    </div>
  }
}

export default Ieee8500PlotsView;