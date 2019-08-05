import * as React from 'react';

import { PlotModel } from '@shared/plot-model/PlotModel';
import { IconButton } from '@shared/buttons';
import { PlotModelComponent } from '@shared/plot-model';
import { Tooltip } from '@shared/tooltip';

import './PlotModelSummary.scss';

interface Props {
  plotModel: PlotModel;
  onRemove: (plotModel: PlotModel) => void;
  onUpdate: (plotModel: PlotModel) => void;
}

interface State {
  components: PlotModelComponent[];
}

export class PlotModelSummary extends React.Component<Props, State> {

  plotName: HTMLElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      components: props.plotModel.components
    };

    this.updatePlotModelName = this.updatePlotModelName.bind(this);
    this.beginEditingPlotName = this.beginEditingPlotName.bind(this);
    this.removePlotModel = this.removePlotModel.bind(this);
  }

  render() {
    return (
      <div className='plot-model-summary'>
        <div className='plot-model-summary__header'>
          <div
            ref={ref => this.plotName = ref}
            className='plot-model-summary__header__plot-name'
            contentEditable
            suppressContentEditableWarning
            onBlur={this.updatePlotModelName}>
            {this.props.plotModel.name}
          </div>
          <Tooltip content='Edit plot name'>
            <IconButton
              rounded={false}
              size='small'
              icon='edit'
              onClick={this.beginEditingPlotName} />
          </Tooltip>
          <IconButton
            rounded={false}
            icon='close'
            style='accent'
            onClick={this.removePlotModel} />
        </div>
        <div className='plot-model-summary__value-types'>
          {
            this.props.plotModel.useMagnitude
            &&
            <div className='plot-model-summary__value-type'>Magnitude</div>
          }
          {
            this.props.plotModel.useAngle
            &&
            <div className='plot-model-summary__value-type'>Angle</div>
          }
        </div>
        <div className='plot-model-summary__components'>
          {this.state.components.map((component, index) => (
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
                    components: existingComponents
                  });
                  if (existingComponents.length > 0)
                    this.props.onUpdate(this.props.plotModel);
                  else
                    this.props.onRemove(this.props.plotModel);
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

  updatePlotModelName(event: React.SyntheticEvent) {
    const newName = (event.target as HTMLElement).textContent;
    if (newName !== '' && newName !== this.props.plotModel.name) {
      this.props.plotModel.name = newName;
      this.props.onUpdate(this.props.plotModel);
    }
  }

  beginEditingPlotName() {
    this.plotName.click();
    this.plotName.focus();
  }

  removePlotModel() {
    this.props.onRemove(this.props.plotModel);
  }

}
