import * as React from 'react';
import { connect } from 'react-redux';
import { select, selectAll } from 'd3-selection';

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
  capbank0a: 'capbank0',
  capbank0b: 'capbank0',
  capbank0c: 'capbank0',
  capbank1a: 'capbank1',
  capbank1b: 'capbank1',
  capbank1c: 'capbank1',
  capbank2a: 'capbank2',
  capbank2b: 'capbank2',
  capbank2c: 'capbank2',
  capbank3: 'capbank3', // Can we make this the same as the others?
  '190-7361': 'VREG4',
  '190-8581': 'VREG3',
  '190-8593': 'VREG2',
  '_hvmv_sub_lsb': 'FEEDER_REG',
  'l2673313': 'l2673313',
  'l2876814': 'l2876814',
  'l2955047': 'l2955047',
  'l3160107': 'l3160107',
  'l3254238': 'l3254238',
  'm1047574': 'm1047574',
  FEEDER_REG: 'FEEDER_REG',
  VREG2: 'VREG2',
  VREG3: 'VREG3',
  VREG4: 'VREG4'
};

export const LabelContainer = connect(mapStateToProps)(class LabelContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps !== this.props)
      console.log;
  }
  render() {
    console.log(this.props.fncsOutput);
    this._updateLabels(this._getLabelsFromFncsOutput());
    return (
      null
    );
  }

  private _getLabelsFromFncsOutput() {
    return this.props.fncsOutput.measurements.reduce((labels, measurement) => {
      if (measurement.conductingEquipmentName in ELEMENT_NAME_MAP)
        labels[measurement.conductingEquipmentName] = measurement;
      return labels;
    }, {});
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
  private _updateLabels(labels) {
    console.log(labels);
    const links = document.querySelector('.topology-model-renderer .links');
    // TopologyModelRenderer is not done rendering yet
    if (!links || links.childElementCount === 0)
      setTimeout(() => this._updateLabels(labels), 1000);
    else {
      const elementNames = Object.keys(labels);
      if (elementNames.length > 0) {
        selectAll('.topology-model-renderer foreignObject').remove();
        for (const elementName of elementNames) {
          const boundElementSelection = select<SVGElement, any>('.topology-model-renderer .' + elementName);
          if (!boundElementSelection.empty()) {
            const boundDatum = boundElementSelection.datum();
            const parentOfBoundElementSelection = select(boundElementSelection.node().parentElement);
            parentOfBoundElementSelection.append('foreignObject')
              .attr('width', 2000)
              .attr('height', 2000)
              .style('width', '2000px')
              .attr('x', boundDatum.rendering_x)
              .attr('y', boundDatum.rendering_y)
              .append('xhtml:div')
              .attr('class', 'label')
              .html(`<header>${elementName}</header>`)
              .append('table')
              .html(() => {
                return labels[elementName].sort((a, b) => a.pt_phase.localeCompare(b.pt_phase))
                  .map((childElement, _, array) => {
                    if (array.length === 1)
                      return `
                    <tr>
                      <td>Switch A</td>
                      <td>${childElement.switchA}</td>
                    </tr>
                    <tr>
                      <td>Switch B</td>
                      <td>${childElement.switchB}</td>
                    </tr>
                    <tr>
                      <td>Switch C</td>
                      <td>${childElement.switchC}</td>
                    </tr>
                  `
                    return `<tr>
                  <td>Switch ${childElement.pt_phase}</td>
                  <td>${childElement['switch' + childElement.pt_phase]}</td>
                </tr>`
                  }).join('');
              });
          }
        }
      }
    }

  }
});