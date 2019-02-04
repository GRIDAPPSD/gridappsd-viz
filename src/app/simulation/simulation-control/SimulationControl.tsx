import * as React from 'react';

import { BasicButton } from '@shared/buttons';

import './SimulationControl.scss';

interface Props {
  timestamp: string;
  onStartSimulation: () => void;
}

export const SimulationControl = (props: Props) => (
  <div className='simulation-control'>
    <span className='simulation-control__timestamp'>{props.timestamp}</span>
    <BasicButton
      label='Start simulation'
      type='positive'
      onClick={props.onStartSimulation} />
  </div>
);