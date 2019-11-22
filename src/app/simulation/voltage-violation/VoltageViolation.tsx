import * as React from 'react';

import { Ripple } from '@shared/ripple';

import './VoltageViolation.light.scss';
import './VoltageViolation.dark.scss';

interface Props {
  violationCounts: number;
  label: string;
}

interface State {
  showLabel: boolean;
}

export class VoltageViolation extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      showLabel: true
    };

    this.toggleLabel = this.toggleLabel.bind(this);
  }

  render() {
    return (
      <section className='voltage-violation'>
        <div
          className='voltage-violation__label'
          style={{
            transform: this.state.showLabel ? 'translateX(0)' : 'translateX(100%)'
          }}>
          {this.props.label}
        </div>
        <Ripple
          fixed
          duration={1500}>
          <div
            className='voltage-violation__counts'
            onClick={this.toggleLabel}>
            {this.props.violationCounts}
          </div>
        </Ripple>
      </section>
    );
  }

  toggleLabel() {
    this.setState({
      showLabel: !this.state.showLabel
    });
  }

}
