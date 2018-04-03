import * as React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event as currentEvent, Selection} from 'd3-selection';

import './TopologyModelRenderer.styles.scss';
import { Wait } from '../wait/Wait';

interface Props {
  model: { nodes: any[], links: any[] };
  isFetching: boolean;
}

interface State {
}

export class TopologyModelRenderer extends React.Component<Props, State> {

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;72
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    this._canvas = select<SVGSVGElement, any>(this._svg);
    this._container = this._canvas.select<SVGGElement>('g');
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.model !== newProps.model)
      this._render(newProps.model);
  }

  render() {
    return (
      <div className='topology-model-renderer'>
        <header>
          <Button onClick={console.log}><Glyphicon glyph='play' /></Button>
        </header>
        <svg ref={elem => this._svg = elem}>
          <g></g>
        </svg>
        <Wait show={this.props.isFetching}/>
      </div>
    );
  }
  private _getChildName(child) {
    return child.name.replace(/(\D+)(\d)(a|b|c)$/, (match: any, p1: any, p2: any, p3: any) => [p1, p2].join(''));
  }

  private _render(model: { nodes: any[]; links: any[] }) {
    const elementData = model.nodes;
    this._container = this._canvas.select<SVGGElement>('g');

    // Compute the x and y bounds
    const xExtent = extent(elementData, (d: any) => { return d.x; });
    const yExtent = extent(elementData, (d: any) => { return d.y; });
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];

    const zoomCenter = { x: 55.164249877758266, y: -139.96588467618716, k: 0.02029557042757985 };
    this._container.selectAll('g').remove();
    const zoomer = zoom()
      .on("zoom", () => {
        this._container.attr('transform', currentEvent.transform)
      });

    function transform() {
      // Set the zoom center
      return zoomIdentity
        .translate(zoomCenter.x, zoomCenter.y)
        .scale(zoomCenter.k)
    }

    // Create an SVG element and a group

    this._canvas.call(zoomer).call(zoomer.transform, transform)
    this._container.attr('transform', `translate(${zoomCenter.x},${zoomCenter.y}) scale(${zoomCenter.k})`);

    // Create an SVG group to hold the links
    let linkGroup = this._container.append('g').attr('class', 'links');

    // Create an SVG group to hold the nodes
    let elementGroup = this._container.append('g').attr('class', 'elements');

    // Create an svg group to hold the current data
    // let curDataGroup = svg.append('g')
    //   .attr('class', 'curData');
    this._container.append('g').attr('class', 'curData');

    // Draw a circle for each node
    let circles = elementGroup.selectAll('circle.element')
      .data(elementData)
      .enter().append('g')
      .filter((element) => { return element.x != undefined && element.y != undefined; })
      //.filter((element:IElement) => { return element.x != 0 && element.y != 0; })
      // .filter((element:IElement) => { return !element.x  && !element.y; })
      .each((element) => {
        element.rendering_x = element.x + xOffset;
        element.rendering_y = element.y + yOffset;

        let className = 'element ' + element.name;
        let isCapacitor = false;
        let isRegulator = false;
        element.children.forEach((child) => {
          className += ' ' + this._getChildName(child);

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
      .attr('class', (element) => element.rendering_baseClass)
      .append('circle')
      .attr('cx', (element) => element.rendering_x)
      .attr('cy', (element) => element.rendering_y)
      .attr('r', (element) => {
        // If the element has a capacitor child, 
        // color it differently
        if (element.children.length == 0) {
          return 50;
        }
        else if (element.children[0].type == 'capacitors' || element.children[0].type == 'regulators') {
          return 150;
        }
        return 50;
      });

    // Add tooltips to the node circles
    circles.append('title').text((element) => {
      if (element.children.length == 0) {
        return 'Node: ' + element.name + ' (' + element.x + ',' + element.y + ')';
      } else if (element.children[0].type == 'capacitors') {
        return 'Capacitor: ' + this._getChildName(element.children[0]);
      } else if (element.children[0].type == 'regulators') {
        return 'Regulator: ' + element.children[0].name;
      }
      return '';
    });

    // A line function for the links
    let lineGenerator:any = line()
      .x((d: any) => { return d.element.x + xOffset })
      .y((d: any) => { return d.element.y + yOffset })

    // Draw the links. Right now, the server sends all from and to node info
    // with the link, but that may change.
    // let lines = linkGroup.selectAll('path.link')
    linkGroup.selectAll('path.link')
      .data(model.links)
      .enter().append('path')
      .filter((link) => { return link.from.x != undefined && link.from.y != undefined && link.to.x != undefined && link.to.y != undefined; })
      //.filter((link:ILink) => { return link.from.x != 0 && link.from.y != 0 && link.to.x != 0 && link.to.y != 0; })
      // .filter((link:ILink) => { return !link.from.x && !link.from.y && !link.to.x  && !link.to.y ; })
      .datum((link) => [{ link: link, element: link.from }, { link: link, element: link.to }])
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
      .attr('d', lineGenerator);

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

    // if (!this.state.hasRenderedTopology) {
    //   this.setState({
    //     hasRenderedTopology: true,
    //     isFirstSimStatusRendering: true,
    //     isFirstCurTimeRendering: this.state.isFirstCurTimeRendering
    //   });
    // }

  }
}