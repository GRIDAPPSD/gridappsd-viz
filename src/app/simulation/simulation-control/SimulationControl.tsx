import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { SimulationStatus } from '@shared/simulation';
import { Tooltip } from '@shared/tooltip';

import './SimulationControl.scss';

interface Props {
  timestamp: string;
  simulationStatus: SimulationStatus;
  simulationId: string;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
}

export const SimulationControl = (props: Props) => (
  <div className='simulation-control'>
    {
      props.simulationId &&
      <div className='simulation-control__simulation-id'>
        <span className='simulation-control__simulation-id__label'>Simulation ID</span>
        <span className='simulation-control__simulation-id__value'>{props.simulationId}</span>
      </div>
    }
    <span className='simulation-control__timestamp'>{props.timestamp}</span>
    {
      props.simulationStatus === SimulationStatus.STARTED || props.simulationStatus === SimulationStatus.RESUMED
        ?
        <>
          <Tooltip position='bottom' content='Pause simulation'>
            <IconButton
              icon='pause'
              className='simulation-control__action'
              onClick={props.onPauseSimulation} />
          </Tooltip>
          <Tooltip position='bottom' content='Stop simulation'>
            <IconButton
              icon='stop'
              className='simulation-control__action'
              onClick={props.onStopSimulation} />
          </Tooltip>
        </>
        : props.simulationStatus === SimulationStatus.PAUSED
          ?
          <>
            <Tooltip position='bottom' content='Resume simulation'>
              <IconButton
                icon='play_arrow'
                className='simulation-control__action resume'
                onClick={props.onResumeSimulation} />
            </Tooltip>
            <Tooltip position='bottom' content='Stop simulation'>
              <IconButton
                icon='stop'
                className='simulation-control__action'
                onClick={props.onStopSimulation} />
            </Tooltip>
          </>
          :
          <Tooltip position='bottom' content='Start simulation'>
            <IconButton
              icon='play_arrow'
              className='simulation-control__action start'
              onClick={props.onStartSimulation} />
          </Tooltip>
    }
  </div>
);