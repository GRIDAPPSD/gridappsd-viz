import * as React from 'react';
import * as d3 from 'd3';
import { Panel } from 'react-bootstrap';
import { ControlledReactComponent } from '../ControlledReactComponent';
import Ieee8500Controller from '../../controllers/ieee8500/Ieee8500Controller';
import Ieee8500PlotsView from './Ieee8500PlotsView';
import DataSource from '../../interfaces/DataSource';
import { Button, Glyphicon } from 'react-bootstrap';

import '../../../css/Ieee8500View.scss';

// Properties required for elements. The server may send more.
interface IElement { name: string, x: number, y: number, rendering_x: number, rendering_y: number, rendering_baseClass: string, children: any[] }

// Properties required for links. The server may send more.
interface ILink { name: string, from: IElement, to: IElement, data: any }

// Processed regulator data used by the UI.
interface IUiRegulatorData { name: string, hasPowerIn: boolean, powerId: string, tapsId: string, voltages: any[], taps: any, powerIns: any }

interface Ieee8500ViewState {
  isFirstCurTimeRendering: boolean;
  isFirstSimStatusRendering: boolean;
  hasRenderedTopology: boolean;
  showModal?: boolean;
};

class Ieee8500View extends ControlledReactComponent<Ieee8500Controller, Ieee8500ViewState> {

  private rowHeight = 300;
  private rowPadding = 50;
  private marginLeft = 50;
  private tableWidth = 3000;
  private roundRadius = 50;
  // private columnWidth = 1000;

  // Note: getInitialState() is not used in ES6 classes.
  constructor(props: any) {
    super(props);
    this.state = {
      isFirstCurTimeRendering: true,
      isFirstSimStatusRendering: true,
      hasRenderedTopology: false,
      showModal: false
    };
    this.showModal = this.showModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentWillMount() {
    console.log('component will mount');
    this.props.controller.model.staticModel.on('change', this.renderTopology, this);
    this.props.controller.model.staticModel.fetch();

    this.props.controller.model.timeseriesModel.on('change', this.renderCurTimeData, this);
    this.props.controller.model.messageModel.on('change', this.renderSimulationData, this);

    if (this.props.controller.dataSource == DataSource.PollingNode) {
      this.props.controller.startPolling();
    }
  }

  componentWillUnmount() {
    this.props.controller.model.staticModel.off('change', this.renderTopology, this);
    this.props.controller.model.timeseriesModel.off('change', this.renderCurTimeData, this);
    this.props.controller.model.timeseriesModel.off('change', this.renderSimulationData, this);

    // TODO: Remove. See componentDidMount for explanation.
    d3.select('button.simulation.start').on('click', null);
  }
  shouldComponentUpdate(newProps, nextState) {
    console.log("newProps:", newProps, "this.props:",this.props, 'this.state:',this.state, 'nextState: ',nextState);
    console.log('newProps.controller.model !== this.props.controller.model: ' + (newProps.controller.model !== this.props.controller.model, this.state !== nextState));
    console.log('this.state !== nextState: ' + (this.state !== nextState));
    return newProps.controller.model !== this.props.controller.model || this.state !== nextState;
  }
  componentDidMount() {
    // TODO: Fix this. We're attaching to an event on another view. The play button 
    // should be part of this view.
    d3.select('button.simulation.start').on('click', this.onSimulationStartClick.bind(this));
  }

  onSimulationStartClick() {
    console.log('Play!!');
    this.props.controller.startSimulation();
  }

  render() {
    console.log('---- render ieee8500view');


    return <div className="view ieee8500">
      <div className="topology" >
        <nav className="navbar navbar">
          <div className="container-fluid">
            <div className="collapse navbar-collapse">
              <ul className="nav navbar-nav navbar-right">
                <li className="timestamp">(Awaiting timeseries data...)</li>
                <li className="simulation start">
                  <Button className="simulation start"><Glyphicon glyph="play" /></Button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
      <div className="plots">
        <Ieee8500PlotsView model={this.props.controller.model} />
      </div>

      <div className="messages">
        <Panel header="Simulation Status" collapsible defaultExpanded>

          {
            this.props.controller.simulationMessage != undefined &&


            <div style={{ maxHeight: 185.19, overflowY: 'scroll' }}>{this.props.controller.simulationMessage.split('\n').map(function (item: any, key: any) {
              return (
                <span key={key}>
                  {item}
                  <br />
                </span>
              )
            })}
            </div>
          }
        </Panel>


      </div>
    </div>
  }

  showModal() {
    this.setState({ ...this.state, showModal: true });
  }
  closeModal() {
    this.setState({ ...this.state, showModal: false });
  }
  renderSimulationData() {
    // const isFirstSimStatusRendering = this.state.isFirstSimStatusRendering;
    const self = this;


    self.setState({
      isFirstSimStatusRendering: false,
      isFirstCurTimeRendering: true,
      hasRenderedTopology: this.state.hasRenderedTopology
    });

  }
  renderCurTimeData() {

    if (!this.state.hasRenderedTopology) {
      return;
    }

    const data = this.props.controller.model.timeseriesModel.get('curTime').data;
    const mapping = this.props.controller.model.staticModel.get('timeseriesToTopologyMapping');

    if (!data.output) {
      return;
    }

    d3.select('.timestamp')
      .text(data.timestamp)
      .on('click', () => this.props.controller.stopPolling());

    // const isFirstCurTimeRendering = this.state.isFirstCurTimeRendering;
    const self = this;

    //console.log(data);
    //console.log(mapping);

    // Group the data by element
    let dataByElementName: any = {};
    let simId = Object.keys(data.output)[0]
    Object.keys(data.output[simId]).forEach((timeseriesName) => {
      const elementName = mapping[timeseriesName];
      if (elementName) {
        let dataForElement = dataByElementName[elementName];
        if (!dataForElement) {
          dataForElement = {};
          dataByElementName[elementName] = dataForElement;
        }
        dataForElement[timeseriesName] = data.output[simId][timeseriesName];
      }
    });

    // Now create/update the tables with all information for 
    // each element
    Object.keys(dataByElementName).forEach((elementName) => {
      const dataForElement = dataByElementName[elementName];
      const selector = 'g.' + elementName;
      const d3Node: any = d3.select(selector);

      // As long as we can find the d3 node we are looking for 
      // (a cell in a table, most likely)
      if (!d3Node.empty()) {
        const element: IElement = d3Node.datum() as IElement;

        // If the datum has a child, which will hold the regulator or capacitor 
        // info because a regulator or capacitor is a child of some parent node
        if (element.children.length > 0) {
          if (element.children[0].type == 'capacitors') {

            if (self.state.isFirstCurTimeRendering) {
              self.appendCapacitorTable(selector, element);
            }

            // Update the table for each capacitor switch
            Object.keys(dataForElement).forEach((capKey) => {
              let capData = dataForElement[capKey];

              // Update cells in an existing display table
              self.updateCapacitorTable(selector, element, capData);
            });

          } else if (element.children[0].type == 'regulators') {
            if (self.state.isFirstCurTimeRendering) {
              self.appendRegulatorTable(selector, element, dataForElement);
            }

            self.updateRegulatorTable(selector, element, dataForElement);
          }
        }
      }
    })

    if (self.state.isFirstCurTimeRendering) {
      self.setState({
        isFirstCurTimeRendering: false,
        isFirstSimStatusRendering: true,
        hasRenderedTopology: this.state.hasRenderedTopology
      });
    }
  }

  getChildName(child: IElement) {
    return child.name.replace(/(\D+)(\d)(a|b|c)$/, (match: any, p1: any, p2: any, p3: any) => [p1, p2].join(''));
  }

  hasDataWithPrefix(elementData: any, prefix: string): boolean {

    let keys = Object.keys(elementData);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(prefix) == 0) {
        return true;
      }
    }
    return false;
  }

  parseRegulatorData(element: IElement, dataForElement: any): IUiRegulatorData {

    let self = this;
    let hasPowerIn = false;
    let powerId = '';
    let tapsId = '';
    let voltages: any[] = [];
    Object.keys(dataForElement).forEach((key) => {
      let elementData = dataForElement[key];
      if (self.hasDataWithPrefix(elementData, 'voltage')) {
        voltages.push({ key: key, data: elementData, label: key.split('_')[2] });
      } else if (self.hasDataWithPrefix(elementData, 'tap')) {
        tapsId = key;
      } else if (self.hasDataWithPrefix(elementData, 'power')) {
        hasPowerIn = true;
        powerId = key;
      }
    });

    let taps = dataForElement[tapsId];
    let powerIns = dataForElement[powerId];

    let name = self.getChildName(element.children[0])

    return { hasPowerIn: hasPowerIn, powerId: powerId, tapsId: tapsId, voltages: voltages, powerIns: powerIns, taps: taps, name: name };
  }

  appendRegulatorTable(selector: string, element: IElement, dataForElement: any) {

    const self = this;
    const rowHeight = self.rowHeight;
    const rowPadding = self.rowPadding;
    const marginLeft = self.marginLeft;
    const roundRadius = self.roundRadius;
    const columnWidths: number[] = [500, 4500, 1000];

    console.log(dataForElement);

    function getRowY(rowIndex: number): number {
      return (rowIndex + 1) * rowHeight + (rowIndex) * rowPadding;
    }

    let regulatorData = this.parseRegulatorData(element, dataForElement);

    if (regulatorData.hasPowerIn) {
      columnWidths.push(5000);
    }

    const numRows = 6;
    const tableWidth = d3.sum(columnWidths);
    const tableHeight = getRowY(numRows) - rowPadding;

    const line: any = d3.line()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    // Create the table w/ the element name title
    // let elementGroup = d3.select(selector);
    let curDataGroup = d3.select('g.curData');
    let g = curDataGroup.append('g')
      .attr('class', 'pnnl-table show ' + regulatorData.name)
      .attr('transform', 'translate(' + (element.rendering_x + 400) + ',' + (element.rendering_y - 1200) + ')');
    g.append('rect')
      .attr('class', 'pnnl-table')
      .attr('rx', roundRadius)
      .attr('ry', roundRadius)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', tableWidth)
      .attr('height', tableHeight);
    g.append('text')
      .attr('class', 'pnnl-table header')
      .attr('x', marginLeft)
      .attr('y', rowHeight)
      .text(self.getChildName(element.children[0]));
    g.append('path')
      .attr('class', 'pnnl-table gridline horizontal header')
      .datum([{ x: 0, y: rowHeight + rowPadding }, { x: tableWidth, y: rowHeight + rowPadding }])
      .attr('d', line);

    // Add column headers
    let rowY = getRowY(2);
    let curX = columnWidths[0];

    // Voltage
    for (let i = 1; i <= regulatorData.voltages.length; i++) {
      g.append('text')
        .attr('class', 'pnnl-table small-header voltage voltage_' + i)
        .attr('x', curX)
        .attr('y', rowY)
        .text('Voltage ' + i);
      curX += columnWidths[i];
    }

    // Tap
    g.append('text')
      .attr('class', 'pnnl-table small-header tap')
      .attr('x', curX)
      .attr('y', rowY)
      .text('Tap');
    curX += columnWidths[regulatorData.voltages.length + 1];

    // Power in
    if (regulatorData.hasPowerIn) {
      g.append('text')
        .attr('class', 'pnnl-table small-header power')
        .attr('x', curX)
        .attr('y', rowY)
        .text('Power In');
    }

    // Add a row for each phase
    let phases = ['A', 'B', 'C'];
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];
      rowY = getRowY(3 + phaseIndex);

      // Row header
      g.append('text')
        .attr('class', 'pnnl-table small-header')
        .attr('x', marginLeft)
        .attr('y', rowY)
        .text(phase);
      curX = columnWidths[0];

      // Voltages
      for (let i = 0; i < regulatorData.voltages.length; i++) {
        g.append('text')
          .attr('class', 'pnnl-table content voltage voltage_' + i + ' phase' + phase)
          .attr('x', curX)
          .attr('y', rowY)
          .text('-');
        d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.voltage.voltage_' + i + '.phase' + phase)
          .text(regulatorData.voltages[i].data['voltage_' + phase]);
        curX += columnWidths[i + 1];
      }

      // Taps
      g.append('text')
        .attr('class', 'pnnl-table content tap phase' + phase)
        .attr('x', curX)
        .attr('y', rowY)
        .text('-');
      d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.tap.phase' + phase)
        .text(regulatorData.taps['tap_' + phase]);
      curX += columnWidths[regulatorData.voltages.length + 1];

      // Power
      if (regulatorData.hasPowerIn) {
        g.append('text')
          .attr('class', 'pnnl-table content power phase' + phase)
          .attr('x', curX)
          .attr('y', rowY)
          .text('-');
        d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.power.phase' + phase)
          .text(regulatorData.powerIns['power_in_' + phase]);
      }
    }

    curDataGroup.append('circle')
      .datum(element)
      .attr('class', 'element regulator ' + regulatorData.name) // TODO: incorporate all switches?
      .attr('cx', element.rendering_x)
      .attr('cy', element.rendering_y)
      .attr('r', 150)
      .on('click', () => {
        let className = g.attr('class');
        if (className.indexOf('show') >= 0) {
          g.attr('class', className.replace('show', 'hide'));
        } else {
          g.attr('class', className.replace('hide', 'show'));
        }
      }).on('mouseover', (element: IElement) => {
        // I don't know why d3.select(this) is not working.
        // I seem to get the React view instead of the d3 node.
        // Bypassing it for now and selecting the element by name.
        d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass + ' mouseover');
      }).on('mouseout', (element: IElement) => {
        d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass);
      });
  }

  updateRegulatorTable(selector: string, element: IElement, dataForElement: any) {

    let regulatorData = this.parseRegulatorData(element, dataForElement);

    // Add a row for each phase
    let phases = ['A', 'B', 'C'];
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];

      // Voltages
      for (let i = 0; i < regulatorData.voltages.length; i++) {
        d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.voltage.voltage_' + i + '.phase' + phase)
          .text(regulatorData.voltages[i].data['voltage_' + phase]);
      }

      // Taps
      d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.tap.phase' + phase)
        .text(regulatorData.taps['tap_' + phase]);

      // Power
      if (regulatorData.hasPowerIn) {
        d3.select('g.pnnl-table.' + regulatorData.name + ' text.pnnl-table.content.power.phase' + phase)
          .text(regulatorData.powerIns['power_in_' + phase]);
      }
    }
  }

  appendCapacitorTable(selector: string, element: IElement) {

    const self = this;
    const rowHeight = self.rowHeight;
    const rowPadding = self.rowPadding;
    const marginLeft = self.marginLeft;
    const tableWidth = self.tableWidth;
    const roundRadius = self.roundRadius;

    const line: any = d3.line()
      .x((d: any) => d.x)
      .y((d: any) => d.y);

    // let elementGroup = d3.select(selector);
    let curDataGroup = d3.select('g.curData');
    let g = curDataGroup.append('g')
      .attr('class', 'pnnl-table show ' + self.getChildName(element.children[0]))
      .attr('transform', 'translate(' + (element.rendering_x + 200) + ',' + (element.rendering_y - 1600) + ')');
    g.append('rect')
      .attr('class', 'pnnl-table')
      .attr('rx', roundRadius)
      .attr('ry', roundRadius)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', tableWidth)
      .attr('height', 4 * rowHeight + 5 * rowPadding);
    g.append('text')
      .attr('class', 'pnnl-table header')
      .attr('x', marginLeft)
      .attr('y', rowHeight)
      .text(self.getChildName(element.children[0]));
    g.append('path')
      .attr('class', 'pnnl-table gridline horizontal header')
      .datum([{ x: 0, y: rowHeight + rowPadding }, { x: tableWidth, y: rowHeight + rowPadding }])
      .attr('d', line);
    g.append('text')
      .attr('class', 'pnnl-table small-header')
      .attr('x', marginLeft)
      .attr('y', 2 * rowHeight + rowPadding)
      .text('Switch A');
    g.append('text')
      .attr('class', 'pnnl-table content capacitor switchA ')
      .attr('x', tableWidth / 2 + marginLeft)
      .attr('y', 2 * rowHeight + rowPadding)
      .text('-');
    g.append('text')
      .attr('x', marginLeft)
      .attr('y', 3 * rowHeight + 2 * rowPadding)
      .text('Switch B');
    g.append('text')
      .attr('class', 'pnnl-table content capacitor switchB ')
      .attr('x', tableWidth / 2 + marginLeft)
      .attr('y', 3 * rowHeight + 2 * rowPadding)
      .text('-');
    g.append('text')
      .attr('x', marginLeft)
      .attr('y', 4 * rowHeight + 3 * rowPadding)
      .text('Switch C');
    g.append('text')
      .attr('class', 'pnnl-table content capacitor switchC ')
      .attr('x', tableWidth / 2 + marginLeft)
      .attr('y', 4 * rowHeight + 3 * rowPadding)
      .text('-');

    curDataGroup.append('circle')
      .datum(element)
      .attr('class', 'element capacitor')
      .attr('cx', element.rendering_x)
      .attr('cy', element.rendering_y)
      .attr('r', 150)
      .on('click', () => {
        let className = g.attr('class');
        if (className.indexOf('show') >= 0) {
          g.attr('class', className.replace('show', 'hide'));
        } else {
          g.attr('class', className.replace('hide', 'show'));
        }
      }).on('mouseover', (element: IElement) => {
        // I don't know why d3.select(this) is not working.
        // I seem to get the React view instead of the d3 node.
        // Bypassing it for now and selecting the element by name.
        d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass + ' mouseover');
      }).on('mouseout', (element: IElement) => {
        d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass);
      });
  }

  updateCapacitorTable(selector: string, element: IElement, curTimeData: any) {

    // let elementGroup = d3.select(selector);

    ['A', 'B', 'C'].forEach((phase) => {
      let value = curTimeData['switch' + phase];
      if (value) {
        d3.select(selector + '.pnnl-table text.pnnl-table.content.capacitor.switch' + phase)
          .attr('class', 'pnnl-table content capacitor switch' + phase + ' ' + value)
          .text(value);
      }
    })
  }

  renderTopology() {

    // This function may be called before all data has been received.
    // Check that the data has been received before attempting to render.
    if (!this.props.controller.model.hasData()) {
      return;
    }

    //console.log(this.props.controller.model.attributes);

    const self = this;
    const elementData = this.props.controller.model.staticModel.get('topology').elements;

    // Compute the x and y bounds
    const xExtent = d3.extent(elementData, (d: any) => { return d.x; });
    const yExtent = d3.extent(elementData, (d: any) => { return d.y; });
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];
    //const zoomCenter = {x: -146.50708757736504, y: -175.543766098824, k: 0.029921138526306484};
    // zoom center for new topology file
    //const zoomCenter = {x: -35082.68104917289, y: -259387.84324810182, k: 0.021157439952773343};
 
    const zoomCenter = { x: 55.164249877758266, y: -139.96588467618716, k: 0.02029557042757985 };
    d3.selectAll('.view.ieee8500 > svg').remove();

    let zoom = d3.zoom()
      .on("zoom", function () {
        // Remember, SVG here is actually the first group 
        // under the svg. Should really rename it!
        if (svg) svg.attr("transform", d3.event.transform);
      })

    function transform() {
      // Set the zoom center
      return d3.zoomIdentity
        .translate(zoomCenter.x, zoomCenter.y)
        .scale(zoomCenter.k)
    }

    // Create an SVG element and a group
    let svg = d3.select('.view.ieee8500 .topology').append('svg')
      .style('width', '100%')
      .style('height', '100%')
      .call(zoom)
      .call(zoom.transform, transform)
      .append('g')
      .attr('transform', 'translate(' + zoomCenter.x + ',' + zoomCenter.y + ') scale(' + zoomCenter.k + ')');

    // Create an SVG group to hold the links
    let linkGroup = svg.append('g')
      .attr('class', 'links');

    // Create an SVG group to hold the nodes
    let elementGroup = svg.append('g')
      .attr('class', 'elements');

    // Create an svg group to hold the current data
    // let curDataGroup = svg.append('g')
    //   .attr('class', 'curData');
    svg.append('g')
      .attr('class', 'curData');

    // Draw a circle for each node
    let circles = elementGroup.selectAll('circle.element')
      .data(elementData)
      .enter().append('g')
      .filter((element: IElement) => { return element.x != undefined && element.y != undefined; })
      //.filter((element:IElement) => { return element.x != 0 && element.y != 0; })
      // .filter((element:IElement) => { return !element.x  && !element.y; })
      .each((element: IElement) => {
        element.rendering_x = element.x + xOffset;
        element.rendering_y = element.y + yOffset;

        let className = 'element ' + element.name;
        let isCapacitor = false;
        let isRegulator = false;
        element.children.forEach((child) => {
          className += ' ' + self.getChildName(child);

          if (child.type == 'capacitors') {
            isCapacitor = true;
          }

          if (child.type == 'regulators') {
            isRegulator = true;
          }
        });

        if (isCapacitor) {
          className += ' capacitors';
        }

        if (isRegulator) {
          className += ' regulators';
        }

        element.rendering_baseClass = className;
      })
      .attr('class', (element: IElement) => element.rendering_baseClass)
      .append('circle')
      .attr('cx', (element: IElement) => element.rendering_x)
      .attr('cy', (element: IElement) => element.rendering_y)
      .attr('r', (element: IElement) => {
        // If the element has a capacitor child, 
        // color it differently
        if (element.children.length == 0) {
          return 50;
        } else if (element.children[0].type == 'capacitors'
          || element.children[0].type == 'regulators') {
          return 150;
        }
        return 50;
      });

    // Add tooltips to the node circles
    circles.append('title').text((element: IElement) => {
      if (element.children.length == 0) {
        return 'Node: ' + element.name + ' (' + element.x + ',' + element.y + ')';
      } else if (element.children[0].type == 'capacitors') {
        return 'Capacitor: ' + self.getChildName(element.children[0]);
      } else if (element.children[0].type == 'regulators') {
        return 'Regulator: ' + element.children[0].name;
      }
      return '';
    });

    // A line function for the links
    let line: any = d3.line()
      .x((d: any) => { return d.element.x + xOffset })
      .y((d: any) => { return d.element.y + yOffset })

    // Draw the links. Right now, the server sends all from and to node info
    // with the link, but that may change.
    // let lines = linkGroup.selectAll('path.link')
    linkGroup.selectAll('path.link')
      .data(this.props.controller.model.staticModel.get('topology').links)
      .enter().append('path')
      .filter((link: ILink) => { return link.from.x != undefined && link.from.y != undefined && link.to.x != undefined && link.to.y != undefined; })
      //.filter((link:ILink) => { return link.from.x != 0 && link.from.y != 0 && link.to.x != 0 && link.to.y != 0; })
      // .filter((link:ILink) => { return !link.from.x && !link.from.y && !link.to.x  && !link.to.y ; })
      .datum((link: ILink) => [{ link: link, element: link.from }, { link: link, element: link.to }])
      .attr('class', (d: any) => 'link ' + d[0].link.name)
      .attr('stroke', (d: any) => {
        switch (d[0].link.data.phases) {
          case 'A':
            return 'blue';
          case 'B':
            return 'orange';
          case 'C':
            return 'green';
          case 'ABC':
            return 'black';
          default:
            return 'darkgray';
        }
      })
      .attr('d', line);

    // An iterative way of drawing the links (vs. the functional way above).
    /*this.props.model.get('links').forEach((link:ILink) => {
        if (link.from.x == undefined 
            || link.from.y == undefined 
            || link.to.x == undefined 
            || link.to.y == undefined) {
                return;
            }

        let stroke = 'green';
        switch(link.data.phases) {
            case 'A':
                return 'blue';
            case 'B':
                return 'yellow';
            case 'C':
                return 'green';
        }

        linkGroup.append('path')
            .datum([link.from, link.to])
            .attr('class', 'link ' + link.name)
            .attr('stroke', stroke)
            .attr('d', line)
            .append('title').text(link.name);
    }) */

    if (!this.state.hasRenderedTopology) {
      this.setState({
        hasRenderedTopology: true,
        isFirstSimStatusRendering: true,
        isFirstCurTimeRendering: this.state.isFirstCurTimeRendering
      });
    }

  }
}

export default Ieee8500View;