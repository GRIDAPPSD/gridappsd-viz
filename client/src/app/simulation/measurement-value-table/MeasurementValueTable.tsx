import { Component, createRef } from 'react';
import { Subscription } from 'rxjs';

import { waitUntil } from '@client:common/misc';
import { SimulationOutputMeasurement } from '@client:common/simulation';
import { CanvasTransformService } from '@client:common/CanvasTransformService';

import './MeasurementValueTable.light.scss';
import './MeasurementValueTable.dark.scss';

interface Props {
  nodeNameToAttachTo: string;
  measurements: {
    taps: SimulationOutputMeasurement[];
    voltages: SimulationOutputMeasurement[];
    powers: SimulationOutputMeasurement[];
  };
}

interface State {
  left: number;
  top: number;
}

export class MeasurementValueTable extends Component<Props, State> {

  readonly simulationLabelRef = createRef<HTMLDivElement>();

  private readonly _canvasTransformService = CanvasTransformService.getInstance();
  private _anchorNodeTransformWatcher: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      left: -1,
      top: -1
    };

  }

  componentDidMount() {
    waitUntil(() => {
      const labelPosition = this._calculateAnchorPosition();
      if (labelPosition.left !== -1) {
        this.setState(labelPosition);
      }
      return labelPosition.left !== -1;
    })
      .then(() => this._repositionLabelWhenMapIsTransformed());
  }

  private _calculateAnchorPosition(): { left: number; top: number } {
    for (const phase of ['', 'a', 'b', 'c']) {
      const anchor = document.querySelector(`.topology-renderer ._${this.props.nodeNameToAttachTo}${phase}_`);
      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const offsetTopOfOffsetParent = this.simulationLabelRef.current.offsetParent
          ? this.simulationLabelRef.current.offsetParent.getBoundingClientRect().top
          : 0;
        return {
          left: anchorRect.left + anchorRect.width / 2,
          top: anchorRect.top - offsetTopOfOffsetParent
        };
      }
    }
    return {
      left: -1,
      top: -1
    };
  }

  private _repositionLabelWhenMapIsTransformed() {
    this._anchorNodeTransformWatcher = this._canvasTransformService.onTransformed()
      .subscribe(() => {
        this.setState(this._calculateAnchorPosition());
      });
  }

  componentWillUnmount() {
    this._anchorNodeTransformWatcher.unsubscribe();
  }

  render() {
    return (
      <div
        ref={this.simulationLabelRef}
        className='measurement-value-table'
        style={{
          left: this.state.left,
          top: this.state.top,
          visibility: this.state.left === -1 ? 'hidden' : 'visible'
        }}>
        <header className='measurement-value-table__heading'>
          {this.props.nodeNameToAttachTo}
        </header>
        <div className='measurement-value-table__content'>
          <table>
            {this.renderMeasurementValueTable()}
          </table>
        </div>
      </div>
    );
  }

  renderMeasurementValueTable() {
    if (this.props.nodeNameToAttachTo.includes('capbank') || this.props.nodeNameToAttachTo.includes('c83')) {
      return (
        <tbody>
          {
            this.props.measurements.taps.map(e => (
              <tr key={e.phases}>
                <td>Switch {e.phases}</td>
                <td>{e.value === 0 ? 'Closed' : 'Open'}</td>
              </tr>
            ))
          }
        </tbody>
      );
    }
    const maximumNumberOfMeasurements = Math.max(
      this.props.measurements.taps.length,
      this.props.measurements.voltages.length,
      this.props.measurements.powers.length
    );
    return (
      <>
        <thead>
          <tr key='header'>
            <th></th>
            <th>Voltage</th>
            <th>Tap</th>
            {
              this.props.nodeNameToAttachTo === 'FEEDER_REG'
              &&
              <th>Power in</th>
            }
          </tr>
        </thead>
        <tbody>
          {this.renderTableBody(maximumNumberOfMeasurements)}
        </tbody>
      </>
    );
  }

  renderTableBody(numberOfMeasurements: number) {
    const body = [];
    for (let i = 0; i < numberOfMeasurements; i++) {
      const tapMeasurement = this.props.measurements.taps[i];
      const voltageMeasurement = this.props.measurements.voltages[i];
      const powerMeasurement = this.props.measurements.powers[i];
      body.push(
        <tr key={i}>
          <td>
            {
              tapMeasurement
              &&
              tapMeasurement.phases
            }
          </td>
          <td>
            {
              voltageMeasurement
              &&
              <>
                {voltageMeasurement.magnitude}
                <span>&ang;</span>
                {`${voltageMeasurement.angle > 0 ? '+' + voltageMeasurement.angle : voltageMeasurement.angle}  V`}
              </>
            }
          </td>
          <td>
            {
              tapMeasurement
              &&
              tapMeasurement.value
            }
          </td>
          {
            this.props.nodeNameToAttachTo === 'FEEDER_REG'
            &&
            <td>
              {
                powerMeasurement
                &&
                <>
                  {powerMeasurement.magnitude}
                  <span>&ang;</span>
                </>
              }
              {
                voltageMeasurement
                &&
                `${voltageMeasurement.angle > 0 ? '+' + voltageMeasurement.angle : voltageMeasurement.angle}  VA`
              }
            </td>
          }
        </tr>
      );
    }
    return body;
  }

}
