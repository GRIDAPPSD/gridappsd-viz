import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { SimulationStatus } from '@shared/simulation';
import { Tooltip } from '@shared/tooltip';
import { Ripple } from '@shared/ripple';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { PlotModelCreator } from './views/plot-model-creator/PlotModelCreator';
import { ModelDictionaryComponent } from '@shared/topology';
import { OverlayService } from '@shared/overlay';

import './SimulationControl.scss';

interface Props {
  timestamp: string;
  simulationStatus: SimulationStatus;
  simulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
  onPlotModelCreationDone: (plotModels: PlotModel[]) => void;
}

interface State {
  simulationIdCopiedSuccessfully: boolean;
  showStartSimulationButton: boolean;
}

export class SimulationControl extends React.Component<Props, State> {

  readonly overlayService = OverlayService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      simulationIdCopiedSuccessfully: false,
      showStartSimulationButton: true
    };

    this.saveSimulationIdToClipboard = this.saveSimulationIdToClipboard.bind(this);
    this.showPlotModelCreator = this.showPlotModelCreator.bind(this);
    this.onPlotModelsCreated = this.onPlotModelsCreated.bind(this);
  }

  render() {
    return (
      <div className='simulation-control'>
        {
          this.props.simulationId
          &&
          < div className='simulation-control__simulation-id'>
            <span className='simulation-control__simulation-id__label'>Simulation ID</span>
            <Ripple>
              <span className='simulation-control__simulation-id__value-wrapper'>
                {
                  this.state.simulationIdCopiedSuccessfully
                  &&
                  <Tooltip content='Copied to clipboard'>
                    <span className='simulation-control__simulation-id__value__copied-successfully-tooltip' />
                  </Tooltip>
                }
                <span
                  className='simulation-control__simulation-id__value'
                  onClick={this.saveSimulationIdToClipboard}
                  style={{ pointerEvents: this.state.simulationIdCopiedSuccessfully ? 'none' : 'all' }}>
                  {this.props.simulationId}
                </span>
              </span>
            </Ripple>
          </div>
        }
        <span className='simulation-control__timestamp'>
          {this.props.timestamp}
        </span>
        {
          this.state.showStartSimulationButton
          &&
          (
            this.props.simulationStatus === SimulationStatus.STARTED || this.props.simulationStatus === SimulationStatus.RESUMED
              ?
              <>
                <Tooltip position='bottom' content='Pause simulation'>
                  <IconButton
                    icon='pause'
                    className='simulation-control__action'
                    onClick={this.props.onPauseSimulation} />
                </Tooltip>
                <Tooltip position='bottom' content='Stop simulation'>
                  <IconButton
                    icon='stop'
                    className='simulation-control__action'
                    onClick={this.props.onStopSimulation} />
                </Tooltip>
              </>
              : this.props.simulationStatus === SimulationStatus.PAUSED
                ?
                <>
                  <Tooltip position='bottom' content='Resume simulation'>
                    <IconButton
                      icon='play_arrow'
                      className='simulation-control__action resume'
                      onClick={this.props.onResumeSimulation} />
                  </Tooltip>
                  <Tooltip position='bottom' content='Stop simulation'>
                    <IconButton
                      icon='stop'
                      className='simulation-control__action'
                      onClick={this.props.onStopSimulation} />
                  </Tooltip>
                </>
                :
                <Tooltip position='bottom' content='Start simulation'>
                  <IconButton
                    icon='play_arrow'
                    disabled={this.props.modelDictionaryComponentsWithConsolidatedPhases.length === 0}
                    className='simulation-control__action start'
                    onClick={this.props.onStartSimulation} />
                </Tooltip>
          )
        }
        <Tooltip
          position='bottom'
          content='Edit plots'>
          <IconButton
            icon='show_chart'
            className='simulation-control__action add-component-to-plot'
            disabled={this.props.modelDictionaryComponentsWithConsolidatedPhases.length === 0}
            onClick={this.showPlotModelCreator} />
        </Tooltip>
      </div>
    );
  }

  saveSimulationIdToClipboard(event: React.SyntheticEvent) {
    const fakeInput = document.createElement('input');
    fakeInput.setAttribute('style', 'position:fixed');
    fakeInput.value = (event.target as HTMLElement).textContent;
    document.body.appendChild(fakeInput);
    fakeInput.select();

    this.setState({
      simulationIdCopiedSuccessfully: document.execCommand('copy')
    });

    window.getSelection().removeAllRanges();
    document.body.removeChild(fakeInput);

    setTimeout(() => {
      this.setState({
        simulationIdCopiedSuccessfully: false
      });
    }, 2000);
  }

  showPlotModelCreator() {
    this.overlayService.show(
      <PlotModelCreator
        modelDictionaryComponentsWithConsolidatedPhases={this.props.modelDictionaryComponentsWithConsolidatedPhases}
        existingPlotModels={this.props.existingPlotModels}
        onSubmit={this.onPlotModelsCreated}
        onClose={this.overlayService.hide} />
    );
  }

  onPlotModelsCreated(plotModels: PlotModel[]) {
    this.props.onPlotModelCreationDone(plotModels);
    this.overlayService.hide();
  }

}
