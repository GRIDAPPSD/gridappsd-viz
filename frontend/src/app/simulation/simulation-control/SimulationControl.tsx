import * as React from 'react';

import { IconButton, BasicButton } from '@shared/buttons';
import { SimulationStatus } from '@commons/SimulationStatus';
import { Tooltip } from '@shared/tooltip';
import { Ripple } from '@shared/ripple';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { PlotModelCreator } from './views/plot-model-creator/PlotModelCreator';
import { ModelDictionaryComponent } from '@shared/topology';
import { copyToClipboard } from '@shared/misc';
import { Restricted } from '@shared/authenticator';
import { PortalRenderer } from '@shared/overlay/portal-renderer';
import { Input, FormControlModel } from '@shared/form';
import { Backdrop } from '@shared/overlay/backdrop';
import { Validators } from '@shared/form/validation';
import { ThreeDots } from '@shared/three-dots';

import './SimulationControl.light.scss';
import './SimulationControl.dark.scss';

interface Props {
  simulationStatus: SimulationStatus;
  simulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
  onResumeThenPauseSimulation: (delay: number) => void;
  onPlotModelCreationDone: (plotModels: PlotModel[]) => void;
}

interface State {
  simulationIdCopiedSuccessfully: boolean;
  showStartSimulationButton: boolean;
}

export class SimulationControl extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      simulationIdCopiedSuccessfully: false,
      showStartSimulationButton: true
    };

    this.saveSimulationIdToClipboard = this.saveSimulationIdToClipboard.bind(this);
    this.showDelayedPauseDurationInputBox = this.showDelayedPauseDurationInputBox.bind(this);
    this.showPlotModelCreator = this.showPlotModelCreator.bind(this);
  }

  render() {
    return (
      <div className='simulation-control'>
        {
          this.props.simulationId
          &&
          <div className='simulation-control__simulation-id'>
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
        <Restricted roles={['testmanager']}>
          {this.showSimulationControlButtons()}
          <Tooltip content='Edit plots'>
            <IconButton
              icon='show_chart'
              className='simulation-control__action add-component-to-plot'
              disabled={this.props.modelDictionaryComponentsWithConsolidatedPhases.length === 0}
              onClick={this.showPlotModelCreator} />
          </Tooltip>
        </Restricted>
      </div>
    );
  }

  saveSimulationIdToClipboard(event: React.SyntheticEvent) {
    this.setState({
      simulationIdCopiedSuccessfully: copyToClipboard((event.target as Element).textContent)
    });

    setTimeout(() => {
      this.setState({
        simulationIdCopiedSuccessfully: false
      });
    }, 2000);
  }

  showSimulationControlButtons() {
    switch (this.props.simulationStatus) {
      case SimulationStatus.STARTING:
        return (
          <span className='simulation-control__simulation-starting-message'>
            Simulation is starting<ThreeDots />
          </span>
        );
      case SimulationStatus.STARTED:
      case SimulationStatus.RESUMED:
        return (
          <>
            <Tooltip content='Pause simulation'>
              <IconButton
                icon='pause'
                className='simulation-control__action'
                onClick={this.props.onPauseSimulation} />
            </Tooltip>
            <Tooltip content='Stop simulation'>
              <IconButton
                icon='stop'
                className='simulation-control__action'
                onClick={this.props.onStopSimulation} />
            </Tooltip>
          </>
        );
      case SimulationStatus.PAUSED:
        return (
          <>
            <Tooltip content='Resume simulation'>
              <IconButton
                icon='play_arrow'
                className='simulation-control__action resume'
                onClick={this.showDelayedPauseDurationInputBox} />
            </Tooltip>
            <Tooltip content='Stop simulation'>
              <IconButton
                icon='stop'
                className='simulation-control__action'
                onClick={this.props.onStopSimulation} />
            </Tooltip>
          </>
        );
      default:
        return (
          <Tooltip content='Start simulation'>
            <IconButton
              icon='play_arrow'
              disabled={this.props.modelDictionaryComponentsWithConsolidatedPhases.length === 0}
              className='simulation-control__action start'
              onClick={this.props.onStartSimulation} />
          </Tooltip>
        );
    }
  }

  showDelayedPauseDurationInputBox(event: React.MouseEvent) {
    const delayedPauseDurationFormControl = new FormControlModel(
      0,
      [Validators.checkNotEmpty('Duration'), Validators.checkValidNumber('Duration')]
    );
    const anchorBoundingBox = (event.target as HTMLElement).getBoundingClientRect();
    const portalRenderer = new PortalRenderer({
      containerClassName: 'simulation-control__delayed-pause-duration-input-container'
    });
    const inputBoxRef = React.createRef<HTMLDivElement>();
    const hideDelayedPauseDurationInputBox = () => {
      inputBoxRef.current.classList.remove('visible');
      inputBoxRef.current.classList.add('hidden');
      setTimeout(portalRenderer.unmount, 500);
      delayedPauseDurationFormControl.cleanup();
    };
    const resumeSimulation = () => {
      const pauseAfterDelayDuration = delayedPauseDurationFormControl.getValue();
      if (pauseAfterDelayDuration === 0) {
        this.props.onResumeSimulation();
      } else {
        this.props.onResumeThenPauseSimulation(pauseAfterDelayDuration);
      }
    };

    delayedPauseDurationFormControl.validityChanges()
      .subscribe({
        next: isValid => {
          if (inputBoxRef.current) {
            (inputBoxRef.current.querySelector('button.positive') as HTMLButtonElement).disabled = !isValid;
          }
        }
      });

    portalRenderer.mount(
      <>
        <Backdrop
          visible
          transparent
          onClick={hideDelayedPauseDurationInputBox} />
        <div
          ref={inputBoxRef}
          className='simulation-control__delayed-pause-duration-input visible'
          style={{
            left: anchorBoundingBox.left,
            top: anchorBoundingBox.top + anchorBoundingBox.height
          }}>
          <div className='simulation-control__delayed-pause-duration-input__arrow' />
          <Input
            label='Pause after'
            hint='Use 0 to disable'
            type='number'
            formControlModel={delayedPauseDurationFormControl} />
          <div className='simulation-control__delayed-pause-duration-input__action-container'>
            <BasicButton
              type='negative'
              label='Cancel'
              onClick={hideDelayedPauseDurationInputBox} />
            <BasicButton
              type='positive'
              label='Submit'
              onClick={() => {
                hideDelayedPauseDurationInputBox();
                resumeSimulation();
              }} />
          </div>
        </div>
      </>
    );
  }

  showPlotModelCreator() {
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <PlotModelCreator
        modelDictionaryComponentsWithConsolidatedPhases={this.props.modelDictionaryComponentsWithConsolidatedPhases}
        existingPlotModels={this.props.existingPlotModels}
        onSubmit={this.props.onPlotModelCreationDone}
        onClose={portalRenderer.unmount} />
    );
  }

}
