import * as React from 'react';
import * as d3 from 'd3';
import {BackboneReactComponent} from '../BackboneReactComponent';
import Ieee8500MainModel from '../../models/ieee8500/Ieee8500MainModel';

import '../../../css/Ieee8500View.scss';

// Properties required for elements. The server may send more.
interface IElement {name:string, x:number, y:number}

// Properties required for links. The server may send more.
interface ILink {name:string, from: IElement, to:IElement, data:any}

class Ieee8500View extends BackboneReactComponent<Ieee8500MainModel, {}> {

    componentWillMount() {
        console.log('component will mount');
        this.props.model.fetch({success: this.renderD3.bind(this)});
    }

    render() {
        return <div className="view ieee8500">
        </div>
    }

    renderD3() {

        console.log('trying to render d3');

        console.log(this.props.model);

        if (!this.props.model.hasData()) {
            return;
        }

        console.log('    has data, rendering.');

        let xExtent = d3.extent(this.props.model.get('elements'), (d:any) => { return d.x; });   
        let yExtent = d3.extent(this.props.model.get('elements'), (d:any) => { return d.y; });
        
        let svg = d3.select('.view.ieee8500').append('svg')
            .style('width', '100%')
            .style('height', '100%')
            .call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform);
            }))
            .append("g");

        let linkGroup = svg.append('g')
            .attr('class', 'links');
        
        let elementGroup = svg.append('g')
            .attr('class', 'elements');

        let circles = elementGroup.selectAll('circle.element')
            .data(this.props.model.get('elements'))
            .enter().append('circle')
                .filter((element:IElement) => { return element.x != undefined && element.y != undefined; })
                .attr('class', (element:IElement) => 'element ' + element.name)
                .attr('r', 50)
                .attr('cx', (element:IElement) => element.x - xExtent[0])
                .attr('cy', (element:IElement) => element.y - yExtent[0]);

        circles.append('title').text((element:IElement) => { return element.name});

        let line:any = d3.line()
            .x((d:any) => { return d.element.x - xExtent[0]})
            .y((d:any) => { return d.element.y - yExtent[0]})

        // Draw the links. Right now, the server sends all from and to node info
        // with the link, but that may change.
        let lines = linkGroup.selectAll('path.link')
            .data(this.props.model.get('links'))
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
    }
}

export default Ieee8500View;