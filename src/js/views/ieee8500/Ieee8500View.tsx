import * as React from 'react';
import * as d3 from 'd3';
import * as Backbone from 'backbone';
import {ControlledReactComponent} from '../ControlledReactComponent';
import Ieee8500Controller from '../../controllers/ieee8500/Ieee8500Controller';
import PlotView from '../common/PlotView';
import Ieee8500PlotsView from './Ieee8500PlotsView';

import '../../../css/Ieee8500View.scss';

// Properties required for elements. The server may send more.
interface IElement {name:string, x:number, y:number, rendering_x:number, rendering_y:number, rendering_baseClass:string, children:any[]}

// Properties required for links. The server may send more.
interface ILink {name:string, from: IElement, to:IElement, data:any}

interface Ieee8500ViewState {isFirstCurTimeRendering: boolean, hasRenderedTopology: boolean};

class Ieee8500View extends ControlledReactComponent<Ieee8500Controller, Ieee8500ViewState> {

    private rowHeight = 300;
    private rowPadding = 50;
    private marginLeft = 50;
    private tableWidth = 3000;
    private roundRadius = 50;
    private columnWidth = 1000;

    // Note: getInitialState() is not used in ES6 classes.
    constructor(props:any) {
        super(props);
        this.state = {isFirstCurTimeRendering: true, hasRenderedTopology: false};
    }

    componentWillMount() {
        console.log('component will mount');
        this.props.controller.model.staticModel.on('change', this.renderTopology, this);
        this.props.controller.model.staticModel.fetch();

        this.props.controller.model.timeseriesModel.on('change', this.renderCurTimeData, this);
        this.props.controller.startPolling();
    }

    componentWillUnmount() {
        this.props.controller.model.staticModel.off('change', this.renderTopology, this);
        this.props.controller.model.timeseriesModel.off('change', this.renderCurTimeData, this);
        
        // TODO: Remove. See componentDidMount for explanation.
        d3.select('button.simulation.start').on('click', null);
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
                <div className="topology" />
                <div className="plots">
                    <Ieee8500PlotsView model={this.props.controller.model} />
                </div>
        </div>
    }

    renderCurTimeData() {

        if (!this.state.hasRenderedTopology) {
            return;
        }

        const data = this.props.controller.model.timeseriesModel.get('curTime').data;
        const mapping = this.props.controller.model.timeseriesModel.get('curTime').timeseriesToTopologyMapping;

        d3.select('.timestamp')
            .text(data.timestamp)
            .on('click', () => this.props.controller.stopPolling());

        const isFirstCurTimeRendering = this.state.isFirstCurTimeRendering;
        const self = this;

        console.log(data);
        console.log(mapping);

        // Group the data by element
        let dataByElementName:any = { };
        Object.keys(data).forEach((timeseriesName) => {
            const elementName = mapping[timeseriesName];
            if (elementName) {
                let dataForElement = dataByElementName[elementName];
                if (!dataForElement) {
                    dataForElement = { };
                    dataByElementName[elementName] = dataForElement;
                }
                dataForElement[timeseriesName] = data[timeseriesName];                  
            }
        });

        // Now create/update the tables with all information for 
        // eahc element
        Object.keys(dataByElementName).forEach((elementName) => {
            const dataForElement = dataByElementName[elementName];
            const element:IElement = d3.select('g.' + elementName).datum() as IElement;
            const selector = 'g.' + elementName;
            if (element.children.length > 0) {
                if (element.children[0].type == 'capacitors') {
                    let capData = dataForElement[Object.keys(dataForElement)[0]];
                    if (self.state.isFirstCurTimeRendering) {
                        self.appendCapacitorTable(selector, element, capData);
                    } else {
                        self.updateCapacitorTable(selector, element, capData);
                    }
                }  else if (element.children[0].type == 'regulators') {
                    if (self.state.isFirstCurTimeRendering) {
                        self.appendRegulatorTable(selector, element, dataForElement);
                    } else {
                        self.updateRegulatorTable(selector, element, dataForElement);
                    }
                }
            } 
        })
        
        if (self.state.isFirstCurTimeRendering) {
            self.setState({
                isFirstCurTimeRendering: false, 
                hasRenderedTopology: this.state.hasRenderedTopology});
        }
    }

    getChildName(child:IElement) {
        return child.name.replace(/(\D+)(\d)(a|b|c)$/, (match:any, p1:any, p2:any, p3:any) => [p1, p2].join(''));
    }

    appendRegulatorTable(selector:string, element:IElement, dataForElement:any) {

        const self = this;
        const rowHeight = self.rowHeight;
        const rowPadding = self.rowPadding;
        const marginLeft = self.marginLeft;
        const roundRadius = self.roundRadius;
        const columnWidths:number[] = [500, 3000, 3000, 1000];

        function getRowY(rowIndex:number):number {
            return (rowIndex + 1) * rowHeight + (rowIndex) * rowPadding;
        }

        // Get the voltages
        let hasPowerIn = false;
        let tapsId = '';
        let voltages:any[] = [];
        Object.keys(dataForElement).forEach((key) => {
            if (key.indexOf('EOL') == 0) {
                voltages.push({key: key, data: dataForElement[key], label: key.split('_')[2]});
            } else if (key.indexOf('reg_taps') >= 0) {
                tapsId = key;
            } else if (key.indexOf('power') >= 0) {
                hasPowerIn = true;
            }
        });

        const numRows = 6 + (hasPowerIn ? 2 : 0);
        const tableWidth = 500 + voltages.length * 3000 + 1000;
        const tableHeight = getRowY(numRows) - rowPadding;

        // Get the power 
        let powerText = '';
        if (hasPowerIn) {
            dataForElement.feeder_power['power_in.real'] + dataForElement.feeder_power['power_in.imag'] + 'i';
        }

        // Get the taps
        let taps = dataForElement[tapsId];
        
        const line:any = d3.line()
            .x((d:any) => d.x)
            .y((d:any) => d.y);

        let elementGroup = d3.select(selector);
        let curDataGroup = d3.select('g.curData');
        let g = curDataGroup.append('g')
            .attr('class', 'pnnl-table show ' + self.getChildName(element.children[0]))
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
            .datum([{x: 0, y: rowHeight + rowPadding}, {x: tableWidth, y: rowHeight + rowPadding}])
            .attr('d', line);
        
        let rowY = getRowY(2);
        let curX = columnWidths[0];
        for (let i = 1; i <= voltages.length; i++) {
            g.append('text')
                .attr('class', 'pnnl-table small-header')
                .attr('x', curX)
                .attr('y', rowY)
                .text('Voltage ' + i);
            curX += columnWidths[i];
        }
        g.append('text')
            .attr('class', 'pnnl-table small-header')
            .attr('x', curX)
            .attr('y', rowY)
            .text('Tap');
        
        let phases = ['A', 'B', 'C'];
        for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
            const phase = phases[phaseIndex];
            rowY = getRowY(3 + phaseIndex);
            g.append('text')
                .attr('class', 'pnnl-table small-header')
                .attr('x', marginLeft)
                .attr('y', rowY)
                .text(phase);
            curX = columnWidths[0];
            for (let i = 0; i < voltages.length; i++) {
                g.append('text')
                    .attr('class', 'pnnl-table content')
                    .attr('x', curX)
                    .attr('y', rowY)
                    .text(voltages[i].data['voltage_' + phase + '.real'] + voltages[i].data['voltage_' + phase + '.imag'] + 'i');
                curX += columnWidths[i + 1];
            }
            g.append('text')
                .attr('class', 'pnnl-table content')
                .attr('x', curX)
                .attr('y', rowY)
                .text(taps['tap_' + phase]);
        }

        if (hasPowerIn) {
        
            rowY = getRowY(7);
            g.append('text')
                .attr('class', 'pnnl-table small-header')
                .attr('x', marginLeft)
                .attr('y', rowY)
                .text('Power in: ');
            g.append('text')
                .attr('class', 'pnnl-table content')
                .attr('x', tableWidth / 5)
                .attr('y', rowY)
                .text(dataForElement.feeder_power['power_in.real'] + dataForElement.feeder_power['power_in.imag']);
        }

        curDataGroup.append('circle')
            .datum(element)
            .attr('class', 'element regulator ' + self.getChildName(element.children[0])) // TODO: incorporate all switches?
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
            }).on('mouseover', (element:IElement) => {
                // I don't know why d3.select(this) is not working.
                // I seem to get the React view instead of the d3 node.
                // Bypassing it for now and selecting the element by name.
                d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass + ' mouseover');
            }).on('mouseout', (element:IElement) => {
                d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass);
            });
    }

    updateRegulatorTable(selector:string, element:IElement, dataForElement:any) {


    }

    appendCapacitorTable(selector:string, element:IElement, curTimeData:any) {

        const self = this;
        const rowHeight = self.rowHeight;
        const rowPadding = self.rowPadding;
        const marginLeft = self.marginLeft;
        const tableWidth = self.tableWidth;
        const roundRadius = self.roundRadius;
        
        const line:any = d3.line()
            .x((d:any) => d.x)
            .y((d:any) => d.y);

        let elementGroup = d3.select(selector);
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
            .datum([{x: 0, y: rowHeight + rowPadding}, {x: tableWidth, y: rowHeight + rowPadding}])
            .attr('d', line);
        g.append('text')
            .attr('class', 'pnnl-table small-header')
            .attr('x', marginLeft)
            .attr('y', 2 * rowHeight + rowPadding)
            .text('Switch A');
        g.append('text')
            .attr('class', 'pnnl-table content capacitor switchA ' + curTimeData.switchA)
            .attr('x', tableWidth / 2 + marginLeft)
            .attr('y', 2 * rowHeight + rowPadding)
            .text(curTimeData.switchA);
        g.append('text')
            .attr('x', marginLeft)
            .attr('y', 3 * rowHeight +  2 * rowPadding)
            .text('Switch B');
        g.append('text')
            .attr('class', 'pnnl-table content capacitor switchB ' + curTimeData.switchB)
            .attr('x', tableWidth / 2 + marginLeft)
            .attr('y', 3 * rowHeight + 2 * rowPadding)
            .text(curTimeData.switchB);
        g.append('text')
            .attr('x', marginLeft)
            .attr('y', 4 * rowHeight + 3 * rowPadding)
            .text('Switch C');
        g.append('text')
            .attr('class', 'pnnl-table content capacitor switchC ' + curTimeData.switchC)
            .attr('x', tableWidth / 2 + marginLeft)
            .attr('y', 4 * rowHeight + 3 * rowPadding)
            .text(curTimeData.switchC);

        curDataGroup.append('circle')
            .datum(element)
            .attr('class', 'element capacitor ' + curTimeData.switchA) // TODO: incorporate all switches?
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
            }).on('mouseover', (element:IElement) => {
                // I don't know why d3.select(this) is not working.
                // I seem to get the React view instead of the d3 node.
                // Bypassing it for now and selecting the element by name.
                d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass + ' mouseover');
            }).on('mouseout', (element:IElement) => {
                d3.select('g.' + element.name + ' > circle').attr('class', element.rendering_baseClass);
            });
    }

    updateCapacitorTable(selector:string, element:IElement, curTimeData:any) {

        let elementGroup = d3.select(selector);
        
        ['A', 'B', 'C'].forEach((phase) => {
            d3.select(selector + '.pnnl-table > text.pnnl-table.content.capacitor.switch' + phase)
                .attr('class', 'pnnl-table content capacitor switch' + phase + ' ' + curTimeData['switch' + phase])
                .text(curTimeData['switch' + phase]);
        })
    }

    renderTopology() {

        // This function may be called before all data has been received.
        // Check that the data has been received before attempting to render.
        if (!this.props.controller.model.hasData()) {
            return;
        }

        console.log(this.props.controller.model.attributes);

        const self = this;
        const elementData = this.props.controller.model.staticModel.get('elements');

        // Compute the x and y bounds
        const xExtent = d3.extent(elementData, (d:any) => { return d.x; });   
        const yExtent = d3.extent(elementData, (d:any) => { return d.y; });
        const xOffset = -xExtent[0];
        const yOffset = -yExtent[0];

        d3.selectAll('.view.ieee8500 > svg').remove();

        let zoom = d3.zoom().on("zoom", function () {
            //console.log(d3.event.transform);
            svg.attr("transform", d3.event.transform);
            //svg.attr('transform', 'translate(-58.490119536500515, 3.9252300834042444)scale(0.027139082025136048)')
        })
        
        // Create an SVG element and a group
        let svg = d3.select('.view.ieee8500 .topology').append('svg')
            .style('width', '100%')
            .style('height', '100%')
            .call(zoom)
            .append('g')
                //.attr('transform', 'translate(-58.490119536500515, 3.9252300834042444)scale(0.027139082025136048)');

        //mainGroup.attr('transform', 'translate(-58.490119536500515, 3.9252300834042444)scale(0.027139082025136048)')

        // Create an SVG group to hold the links
        let linkGroup = svg.append('g')
            .attr('class', 'links');
        
        // Create an SVG group to hold the nodes
        let elementGroup = svg.append('g')
            .attr('class', 'elements');
        
        // Create an svg group to hold the current data
        let curDataGroup = svg.append('g')
            .attr('class', 'curData');

        // Draw a circle for each node
        let circles = elementGroup.selectAll('circle.element')
            .data(elementData)
            .enter().append('g')
                .filter((element:IElement) => { return element.x != undefined && element.y != undefined; })
                .each((element:IElement) => {
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
                .attr('class', (element:IElement) => element.rendering_baseClass)
                .append('circle')
                    .attr('cx', (element:IElement) => element.rendering_x)
                    .attr('cy', (element:IElement) => element.rendering_y)
                    .attr('r', (element:IElement) => {
                        // If the element has a capacitor child, 
                        // color it differently
                        if (element.children.length == 0) {
                            return 50;
                        } else if (element.children[0].type == 'capacitors'
                                || element.children[0].type == 'regulators') {
                            return 150;
                        }  
                    });
        
        // Add tooltips to the node circles
        circles.append('title').text((element:IElement) => 
        { 
            if (element.children.length == 0) {
                return 'Node: ' + element.name + ' (' + element.x + ',' + element.y + ')'; 
            } else if (element.children[0].type == 'capacitors') {
                return 'Capacitor: ' + self.getChildName(element.children[0]);
            } else if (element.children[0].type == 'regulators') {
                return 'Regulator: ' + element.children[0].name;
            }
        });

        // A line function for the links
        let line:any = d3.line()
            .x((d:any) => { return d.element.x + xOffset})
            .y((d:any) => { return d.element.y + yOffset})

        // Draw the links. Right now, the server sends all from and to node info
        // with the link, but that may change.
        let lines = linkGroup.selectAll('path.link')
            .data(this.props.controller.model.staticModel.get('links'))
            .enter().append('path')
                .filter((link:ILink) => { return link.from.x != undefined && link.from.y != undefined && link.to.x != undefined && link.to.y != undefined; })
                .datum((link:ILink) => [{link: link, element: link.from}, {link: link, element: link.to}])
                .attr('class', (d:any) => 'link ' + d[0].link.name)
                .attr('stroke', (d:any) => {
                    switch(d[0].link.data.phases) {
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
                isFirstCurTimeRendering: this.state.isFirstCurTimeRendering});  
        }          
    }
}

export default Ieee8500View;