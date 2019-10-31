import * as React from 'react';

import './VoltageViolation.light.scss';
import './VoltageViolation.dark.scss';

interface Props {
  violationCounts: number;
}

export function VoltageViolation(props: Props) {
  return (
    <section className='voltage-violation'>
      <div className='voltage-violation__label'>Voltage Violation Counts</div>
      <div className='voltage-violation__counts'>{props.violationCounts}</div>
    </section>
  );
}
