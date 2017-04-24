import * as React from 'react';
import * as d3 from 'd3';
import {BackboneReactComponent} from '../BackboneReactComponent';
import IPlotDatum from '../../models/common/IPlotDatum';
import PlotModel from '../../models/common/PlotModel';
import PlotSeriesModel from '../../models/common/PlotSeriesModel';

import '../../../css/PlotView.scss';

class PlotView extends BackboneReactComponent<PlotModel, {}> {

    componentWillMount() {
        this.props.model.on('change:seriesCollection', this.forceUpdate.bind(this, null), this);
        this.props.model.on('change:data', this.updateD3, this);
    }

    componentWillUnmount() {
        this.props.model.off('change:seriesCollection', null, this);
        this.props.model.off('change:data', this.updateD3, this);
    }

    componentDidMount() {
        this.initializeD3();
    }

    getPlotLabel(plotName:string):string {
        return plotName[0].toUpperCase() + plotName.substring(1).replace(/_/g, ' ');
    }

    render() {
        //console.log('rendering plot: ' + this.props.model.name);
        
        return <div className={"plot-view " + this.props.model.name}>
            <h5 className="plot title">{this.getPlotLabel(this.props.model.name)}</h5>
        </div>
    }

    initializeD3() {

        const height = 200;

        let mainGroup = d3.select('.plot-view.' + this.props.model.name).append('svg')
            .style('width', 400)
            .style('height', height)
            .append('g')
                .attr('class', 'plot ' + this.props.model.name);
    }

    updateD3() {

        //console.log('rendering plots....');

        //const width = d3.select('.plot-view').node().getBoundingClientRect().width;

        let height = 200; // TODO: pass in with props
        let width = 400;
        let margin = {top: 10, bottom: 50, left: 50, right: 10};
        let mainGroup = d3.select('g.plot.' + this.props.model.name);

        mainGroup.selectAll('.axis').remove();
        mainGroup.selectAll('path').remove();

        // Add the title 
        let x = d3.scaleTime().range([margin.left, width - margin.right]);
        let y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

        //console.log(this.props.model.name);
        //console.log(this.props.model.getXDomain());
        //console.log(this.props.model.getYDomain());

        x.domain(this.props.model.getXDomain());
        y.domain(this.props.model.getYDomain());

        // Add the x-axis
        mainGroup.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
            .call(d3.axisBottom(x));

        // Add the y-axis 
        mainGroup.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', 'translate(' + margin.left + ',0)')
            .call(d3.axisLeft(y))
            .append('text')
                .attr('class', 'plot')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '0.71em')
                .attr('font-size', '10px');

        let line = d3.line<IPlotDatum>()
            .x((datum:any) => x(datum.xRaw))
            .y((datum:any) => y(datum.yRaw))

        let self = this;
        this.props.model.seriesCollection.models.forEach((series:PlotSeriesModel) => {
            
            mainGroup.append('path')
                .datum(series.data)
                .attr('class', self.props.model.name + ' ' + series.name + ' ' + series.topologyElementName)
                .attr('d', line);
        });
    }
}

export default PlotView;