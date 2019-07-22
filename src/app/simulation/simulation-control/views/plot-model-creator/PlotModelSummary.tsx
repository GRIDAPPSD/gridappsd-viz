import * as React from 'react';

import { PlotModel, PlotModelComponent } from '@shared/plot-model';
import { IconButton } from '@shared/buttons';

import './PlotModelSummary.scss';

interface Props {
  plotModel: PlotModel;
  onRemove: (plotModel: PlotModel) => void;
  onUpdate: (plotModel: PlotModel) => void;
}

interface State {
  plotModelComponents: PlotModelComponent[];
}

export class PlotModelSummary extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      plotModelComponents: props.plotModel.components
    };

    this.removePlotModel = this.removePlotModel.bind(this);
  }

  render() {
    return (
      <div className='plot-model-summary'>
        <div className='plot-model-summary__header'>
          <div className='plot-model-summary__header__plot-name'>
            {this.props.plotModel.name}
          </div>
          <IconButton
            rounded={false}
            icon='close'
            style='accent'
            onClick={this.removePlotModel} />
        </div>
        <div className='plot-model-summary__components'>
          {this.state.plotModelComponents.map((component, index) => (
            <div
              key={index}
              className='plot-model-summary__component'>
              <IconButton
                icon='close'
                style='accent'
                size='small'
                onClick={() => {
                  const existingComponents = this.props.plotModel.components.filter(existing => existing !== component);
                  this.props.plotModel.components = existingComponents;
                  this.setState({
                    plotModelComponents: existingComponents
                  });
                  if (existingComponents.length > 0)
                    this.props.onUpdate({ ...this.props.plotModel });
                  else
                    this.props.onRemove(this.props.plotModel)
                }} />
              <div className='plot-model-summary__component__name'>
                {component.displayName}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  removePlotModel() {
    this.props.onRemove(this.props.plotModel);
  }

}
