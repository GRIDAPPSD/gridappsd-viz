"use strict"

var httpPort = 8082;

console.log(__dirname);

var express = require('express'),
    http = require('http');
var app = express();
var server = http.createServer(app);
var fs = require('fs');

server.listen(httpPort);

app.use(express.static(__dirname));
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname);

app.get(['/', '/ieee8500'], function(req, res) {
    res.render('index.html');
});

/** Input: 
 *  ieee8500_base.json
    {feeder: [
        {swing_nodes: [
            {name:, phases:, nominal_voltage:}
        ]},
        {capacitors: [
            {name:, parent:, phases:, kvar_A:, kvar_B:, kvar_C}
        ]},
        {overhead_lines: [
            {name:, from:, to:, phases:, length:, configuration:}
        ]},
        {transformers: [
            {name:, from:, to:, phases:, configuration:}
        ]},
        {regulators: [
            {name:, from:, to:, phases:, configuration:}
        ]}
    ]}

    ieee8500_xy.json
    {coordinates: [
        {node:, x:, y:}
    ]}
    
    Output:
    {elements: [
        // May want to change this depending on use. 
        // Right now, going with format used by D3 layout algorithms:
        // https://bl.ocks.org/mbostock/4062045
        {name:, type:, data:} 
    ], 
    links: [
        {name:, from:, to:, data:}
    ]}
*/
app.get('/data/ieee8500', (req, res) => {

    function getOrCreateElement(name, type, hashByName, elementsList) {

        let existingElement = hashByName[name];
        if (!existingElement) {
            existingElement = {name: name, type: type, data: {}, children: []};
            hashByName[name] = existingElement;
            elementsList.push(existingElement);
        }
        return existingElement;
    }

    let baseContents = fs.readFileSync('./data/ieee8500/ieee8500_base.json', 'utf-8');
    let baseJson = JSON.parse(baseContents);

    let coordinateContents = fs.readFileSync('./data/ieee8500/ieee8500_xy.json', 'utf-8');
    let coordinateJson = JSON.parse(coordinateContents);

    let knownElementsByName = {};
    let elements = [];
    let links = [];

    // Create top-level elements
    [{index: 0, type: 'swing_nodes'},
    {index: 3, type: 'transformers'},
    {index: 4, type: 'regulators'}].forEach((group) => {
        baseJson.feeder[group.index][group.type].forEach((element) => {
                elements.push({
                    name: element.name, 
                    type: group.type, 
                    data: element,
                    children: []});
            })
    })
    
    // Create the lines, creating nodes as needed along the way
    baseJson.feeder[2].overhead_lines.forEach((overheadLine) => {

        let fromNode = getOrCreateElement(overheadLine.from, 'node', knownElementsByName, elements);
        let toNode = getOrCreateElement(overheadLine.to, 'node', knownElementsByName, elements);

        links.push({
            name: overheadLine.name,
            from: fromNode,
            to: toNode,
            data: overheadLine
        })
    })

    // Add the capacitors under the nodes
    baseJson.feeder[1]['capacitors'].forEach((element) => {
        let parent = knownElementsByName[element.parent];
        parent.children.push({
            name: element.name,
            type: 'capacitors',
            data: element,
            children: []
        })
    })

    let numMissingNodes = 0;
    let numFoundNodes = 0;
    coordinateJson.coordinates.forEach((coordinate) => {

        let node = knownElementsByName[coordinate.node];
        if (node == undefined) {
            console.log('missing node ' + coordinate.node + ' for which coordinates exist.');
            numMissingNodes++;
            return;
        } else {
            numFoundNodes++;
        }
        node.x = coordinate.x;
        node.y = coordinate.y;
    })
    console.log(numMissingNodes + ' nodes missing, ' + numFoundNodes + ' found');

    res.json({
        elements: elements,
        links: links
    })

}); 

console.log('Server running at: localhost ' + httpPort);