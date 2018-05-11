import * as React from 'react';
import { connect } from 'react-redux';
import { select } from 'd3-selection';

import { AppState } from '../../models/AppState';
import { FncsOutput } from '../../models/fncs-output/FncsOutput';

// import './filename.styles.scss';

interface Props {
  fncsOutput: FncsOutput;
}

interface State {
}

const mapStateToProps = (state: AppState): Props => ({
  fncsOutput: state.fncsOutput
})

const ELEMENT_NAME_MAP = {
  capbank0: ['A', 'B', 'C'],
  capbank1: ['A', 'B', 'C'],
  capbank2: ['A', 'B', 'C'],
  capbank3: ['A', 'B', 'C'],
  VREG2: ['A', 'B', 'C'],
  VREG3: ['A', 'B', 'C'],
  VREG4: ['A', 'B', 'C'],
  FEEDER_REG: ['A', 'B', 'C']
};

export const LabelContainer = connect(mapStateToProps)(class LabelContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps !== this.props) {
      this._updateLabels(newProps.fncsOutput);
    }
  }
  render() {
    return (
      null
    );
  }

  /*
    This is really ugly,
    initial design was to pass the labels as a prop to TopologyModelRenderer like below,
    but it caused so many unneeded rerenders
    <TopologyModelRenderer
        topology={_transformModel(this.state.topology)}
        showWait={this.state.isFetching}
        labels={this.state.labels} --> Made this class's render method run when it changes
        onStartSimulation={() => SIMULATION_CONTROL_SERVICE.startSimulation(this.props.simulationConfig)} />
    So do this to avoid it (but this is a container component)
  */
  private _updateLabels(fncsOutput: FncsOutput) {
    const topLevelGElementSelection = select('.topology-model-renderer svg > g');
    topLevelGElementSelection.selectAll('foreignObject').remove();
    Object.keys(ELEMENT_NAME_MAP).forEach(name => {
      const boundElementSelection = select<SVGElement, any>('.topology-model-renderer .' + name);
      if (!boundElementSelection.empty()) {
        const boundDatum = boundElementSelection.datum();
        topLevelGElementSelection.append('foreignObject')
          .attr('width', 2000)
          .attr('height', 2000)
          .style('width', '2000px')
          .attr('x', boundDatum.rendering_x)
          .attr('y', boundDatum.rendering_y)
          .append('xhtml:div')
          .attr('class', 'label')
          .html(`<header>${name}</header>`)
          .append('table')
          .html(() => {
            // getting values for taps
            const filteredMeasurements = fncsOutput.measurements.filter(m => m.conductingEquipmentName.includes(name) && m.type === 'Pos');
            const measurementsAtPhases = [];
            // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
            filteredMeasurements.forEach(m => {
              if (ELEMENT_NAME_MAP[name].includes(m.phases) && measurementsAtPhases.findIndex(e => e.phases === m.phases) === -1)
                measurementsAtPhases.push(m);
            });

            if (name.includes('capbank')) {
              return measurementsAtPhases.map(node => (
                `
                <tr>
                  <td>Switch ${node.phases}</td>
                  <td>${node.value === 0 ? 'CLOSED' : 'OPEN'}</td>
                </tr>
                `
              )).join('')
            }
            else {
              // get measurements for voltages
              const voltages = fncsOutput.measurements.filter(m => measurementsAtPhases[0].connectivityNode === m.connectivityNode && m.type === 'PNV');
              const voltagesAtPhases = [];
              // discard measures with phases that were already added
              voltages.forEach(m => {
                if (ELEMENT_NAME_MAP[name].includes(m.phases) && voltagesAtPhases.findIndex(e => e.phases === m.phases) === -1)
                voltagesAtPhases.push(m);
              });
              const powers = fncsOutput.measurements.filter(m => m.conductingEquipmentName === 'hvmv_sub' && m.type === 'VA');
              const powersAtPhases = [];
              // Only get the measurements for phases A, B, C and discard measurements with duplicate phases
              powers.forEach(m => {
                if (ELEMENT_NAME_MAP[name].includes(m.phases) && powersAtPhases.findIndex(e => e.phases === m.phases) === -1)
                  powersAtPhases.push(m);
              });
  
              let output = `
              <tr>
                <th style='width:800px;display:inline-block;'></th>
                <th>Voltage</th>
                <th style='width:2000px;display:inline-block;text-align:center'>Tap</th>
                ${name === 'FEEDER_REG' ? '<th>Power in</th>': ''}
              </tr>
              `;
              for (let i = 0; i < measurementsAtPhases.length; i++) {
                output += `
                  <tr>
                    <td>${measurementsAtPhases[i].phases}</td>
                    <td style='text-align:left'>${voltagesAtPhases[i].magnitude + '<span style="font-size:1200px">\u2220</span>' + (voltagesAtPhases[i].angle > 0 ? '+' + voltagesAtPhases[i].angle : voltagesAtPhases[i].angle) + ' V'}</td>
                    <td style='text-align:center'>${measurementsAtPhases[i].value}</td>
                    ${name === 'FEEDER_REG' ? '<td>' + powersAtPhases[i].magnitude + '<span style="font-size:1200px">\u2220</span>' + (voltagesAtPhases[i].angle > 0 ? '+' + voltagesAtPhases[i].angle : voltagesAtPhases[i].angle) + ' VA</td>' : ''}
                  </tr>
                `;
              }
              return output;
            }
          });
      }

    });
  }

});