import { Component, createRef } from 'react';

import { PlotModel } from '@client:common/plot-model/PlotModel';
import { IconButton } from '@client:common/buttons';
import { Tooltip } from '@client:common/tooltip';
import { PlotModelComponent } from '@client:common/plot-model';

import './PlotModelSummary.light.scss';
import './PlotModelSummary.dark.scss';

interface Props {
  plotModel: PlotModel;
  onRemove: (plotModel: PlotModel) => void;
  onUpdate: (plotModel: PlotModel) => void;
}

interface State {
  components: PlotModelComponent[];
}

export class PlotModelSummary extends Component<Props, State> {

  readonly plotNameElementRef = createRef<HTMLDivElement>();

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
            ref={this.plotNameElementRef}
            className='plot-model-summary__header__plot-name'
            contentEditable
            suppressContentEditableWarning
            onBlur={this.updatePlotModelName}>
            {this.props.plotModel.name}
          </div>
          <Tooltip content='Edit plot name'>
            <IconButton
              size='small'
              icon='edit'
              onClick={this.beginEditingPlotName} />
          </Tooltip>
          <IconButton
            size='small'
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
          {
            this.state.components.map((component, index) => (
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
                    if (existingComponents.length > 0) {
                      this.props.onUpdate(this.props.plotModel);
                    } else {
                      this.props.onRemove(this.props.plotModel);
                    }
                  }} />
                <div className='plot-model-summary__component__name'>
                  {component.displayName}
                </div>
              </div>
            ))
          }
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
    this.plotNameElementRef.current.click();
    this.plotNameElementRef.current.focus();
  }

  removePlotModel() {
    this.props.onRemove(this.props.plotModel);
  }

}
