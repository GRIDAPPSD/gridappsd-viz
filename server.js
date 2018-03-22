"use strict"

var httpPort = 8082;

console.log(__dirname);

var express = require('express'),
  http = require('http');
var app = express();
var server = http.createServer(app);
var fs = require('fs');
const path = require('path');

server.listen(httpPort);

app.use(express.static(__dirname));
app.use(express.static(path.resolve(__dirname, 'dist')));
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname);

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get(['/', '/ieee8500'], function(req, res) {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.get('/data/ieee8500', (req, res) => {

  let topologyJson = getIeee8500Topology();

  res.json({
    topology: topologyJson,
    timeseriesToTopologyMapping: getTimeseriesToTopologyMappingNewFormat(),
    timeseriesToPlotSeriesMapping: getTimeseriesToPlotSeriesMappingNewFormat()
  });

});

app.get('/data/titanium', (req, res) => {

  let topologyJson = getTitaniumTopology();

  res.json({
    topology: topologyJson
  });
})

function getTitaniumTopology() {
  return getTopology('./data/titanium/Titanium_base.json', './data/titanium/Titanium_xy.json');
}

function getIeee8500Topology() {
  //return getTopology('./data/ieee8500/ieee8500_base.json', './data/ieee8500/ieee8500_xy.json');
  //read model topology and x,y  coordinates from the new CIM format file
  return getTopology('./data/ieee8500/ieee8500_symbols.json');
}

function getTopology(baseFilePath) {

  function getOrCreateElement(name, type, hashByName, elementsList) {
    let existingElement = hashByName[name];
    if (!existingElement) {
      existingElement = { name: name, type: type, data: {}, children: [] };
      hashByName[name] = existingElement;
      elementsList.push(existingElement);

    }
    return existingElement;
  }

  let baseContents = fs.readFileSync(baseFilePath, 'utf-8');
  let baseJson = JSON.parse(baseContents);

  //let coordinateContents = fs.readFileSync(xyFilePath, 'utf-8');
  //let coordinateJson = JSON.parse(coordinateContents);

  let knownElementsByName = {};
  let elements = [];
  let links = [];

  let regulatorParents = {
    reg_VREG3: 'nd_l2692633',
    reg_VREG4: 'nd_m1089120',
    reg_VREG2: 'nd_l2841632',
    reg_FEEDER_REG: 'nd_m1209814'
  };

  const groupNames = ['swing_nodes', 'transformers', 'overhead_lines', 'capacitors', 'regulators'];
  // Create top-level elements
  for (const groupName of groupNames) {
    const group = baseJson.feeder.filter(group => groupName in group)[0];
    switch (Object.keys(group)[0]) {
      case 'swing_nodes':
      case 'transformers':
        for (const element of group[groupName])
          elements.push({
            name: element.name,
            type: group.type,
            data: element,
            children: []
          });
        break;
      case 'capacitors':
        for (const capacitor of group[groupName]) {
          const parent = knownElementsByName[capacitor.parent];
          if (parent)
            parent.children.push({
              name: capacitor.name,
              type: 'capacitors',
              data: capacitor,
              children: []
            });
          else
            console.log('Missing capacitor parent ' + capacitor.parent);
        }
        break;
      case 'overhead_lines':
        for (const overheadLine of group[groupName]) {
          const fromNode = getOrCreateElement(overheadLine.from, 'node', knownElementsByName, elements);
          const toNode = getOrCreateElement(overheadLine.to, 'node', knownElementsByName, elements);
          if (overheadLine.x1 !== 0.0 && overheadLine.y1 !== 0.0 && overheadLine.x2 !== 0.0 && overheadLine.y2 !== 0.0) {
            fromNode.x = overheadLine.x1;
            fromNode.y = overheadLine.y1;
            toNode.x = overheadLine.x2;
            toNode.y = overheadLine.y2;
          }
          links.push({
            name: overheadLine.name,
            from: fromNode,
            to: toNode,
            data: overheadLine
          });
        }
        break;
      case 'regulators':
        for (const regulator of group[groupName]) {
          const parent = knownElementsByName[regulatorParents[regulator.name]];
          if (parent)
            parent.children.push({
              name: regulator.name,
              type: 'regulators',
              data: regulator,
              children: []
            });
          else
            console.log('Missing regulator parent ' + regulatorParents[regulator.name] + ' for ' + regulator.name);
        }
        break;
      default:
        console.warn('What???');
        break;
    }
  }
  // [
  //   { index: 0, type: 'swing_nodes' },
  //   { index: 3, type: 'transformers' }
  // ].forEach((group) => {
  //   console.log(group);
  //   console.log(baseJson.feeder[group.index]);
  //   baseJson.feeder[group.index][group.type].forEach((element) => {
  //     elements.push({
  //       name: element.name,
  //       type: group.type,
  //       data: element,
  //       children: []
  //     });
  //   })
  // })

  // Create the lines, creating nodes as needed along the way
  // baseJson.feeder[2].overhead_lines.forEach((overheadLine) => {

  //   let fromNode = getOrCreateElement(overheadLine.from, 'node', knownElementsByName, elements);
  //   let toNode = getOrCreateElement(overheadLine.to, 'node', knownElementsByName, elements);
  //   if (overheadLine.x1 != 0.0 && overheadLine.y1 != 0.0 && overheadLine.x2 != 0.0 && overheadLine.y2 != 0.0) {
  //     fromNode.x = overheadLine.x1;
  //     fromNode.y = overheadLine.y1;
  //     toNode.x = overheadLine.x2;
  //     toNode.y = overheadLine.y2;
  //   }

  //   links.push({
  //     name: overheadLine.name,
  //     from: fromNode,
  //     to: toNode,
  //     data: overheadLine
  //   })
  // })

  // Add the capacitors under the nodes
  // baseJson.feeder[1].capacitors.forEach((element) => {
  //   let parent = knownElementsByName[element.parent];
  //   if (parent) {
  //     parent.children.push({
  //       name: element.name,
  //       type: 'capacitors',
  //       data: element,
  //       children: []
  //     })
  //   } else {
  //     console.log('Missing capacitor parent ' + element.parent);
  //   }
  // })

  // Add the regulators under the nodes 
  // console.log(baseJson.feeder[4]);
  // baseJson.feeder[4].regulators.forEach((element) => {
  //   let parent = knownElementsByName[regulatorParents[element.name]];
  //   if (parent) {
  //     parent.children.push({
  //       name: element.name,
  //       type: 'regulators',
  //       data: element,
  //       children: []
  //     })
  //   } else {
  //     console.log('Missing regulator parent ' + regulatorParents[element.name] + ' for ' + element.name);
  //   }
  // })

  /*let numMissingNodes = 0;
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
  */
  let topologyJson = {
    elements: elements,
    links: links
  };

  return topologyJson;
}

let timeseriesData = null;
let timeseriesIndex = 0;

function getTimeseriesData(filename) {

  const contents = fs.readFileSync(filename, 'utf-8');
  const lines = contents.trim().split('\n');
  let headers = [];
  let data = [];
  lines.forEach((line) => {
    if (line.indexOf('# timestamp') == 0) {
      headers = line.replace('# ', '').trim().split(',');
    } else if (line.indexOf('#') != 0) {
      const tokens = line.trim().split(',');
      let datum = {};
      for (var i = 0; i < tokens.length; i++) {
        datum[headers[i]] = tokens[i];
      }
      data.push(datum);
    }
  });
  return data;
}

function getAllTimeseriesData() {

  const dataFileNames = ['cap_0',
    'cap_1',
    'cap_2',
    'cap_3',
    'EOL_1_1_V',
    'EOL_1_2_V',
    'EOL_2_1_V',
    'EOL_2_2_V',
    'EOL_3_1_V',
    'EOL_4_1_V',
    'feeder_power',
    'feeder_reg_taps',
    'reg_taps_2',
    'reg_taps_3',
    'reg_taps_4'
  ];

  let allData = {};
  dataFileNames.forEach((filename) => {
    let fileData = getTimeseriesData('./data/ieee8500/timeseries/' + filename + '.csv');
    allData[filename] = fileData;
  });

  let timeseriesData = [];
  let cap0Data = allData['cap_0'];
  for (var i = 0; i < cap0Data.length; i++) {
    let datum = {};
    datum.timestamp = cap0Data[i].timestamp;
    dataFileNames.forEach((filename) => {
      datum[filename] = allData[filename][i];
    })
    timeseriesData.push(datum);
  }

  return timeseriesData;
}

function getAllTimeseriesDataNewFormat() {

  return JSON.parse(fs.readFileSync('./data/ieee8500/timeseries/goss_output.json'));
}

function getTimeseriesToTopologyMapping() {

  return {
    cap_0: 'cap_capbank0',
    cap_1: 'cap_capbank1',
    cap_2: 'cap_capbank2',
    cap_3: 'cap_capbank3',
    EOL_1_1_V: 'reg_FEEDER_REG',
    EOL_1_2_V: 'reg_FEEDER_REG',
    EOL_2_1_V: 'reg_VREG2',
    EOL_2_2_V: 'reg_VREG2',
    EOL_3_1_V: 'reg_VREG3',
    EOL_4_1_V: 'reg_VREG4',
    feeder_power: 'reg_FEEDER_REG',
    feeder_reg_taps: 'reg_FEEDER_REG',
    reg_taps_2: 'reg_VREG2',
    reg_taps_3: 'reg_VREG3',
    reg_taps_4: 'reg_VREG4'
  }
}

function getTimeseriesToTopologyMappingNewFormat() {

  return {
    cap_capbank0a: 'cap_capbank0',
    cap_capbank0b: 'cap_capbank0',
    cap_capbank0c: 'cap_capbank0',
    cap_capbank1a: 'cap_capbank1',
    cap_capbank1b: 'cap_capbank1',
    cap_capbank1c: 'cap_capbank1',
    cap_capbank2a: 'cap_capbank2',
    cap_capbank2b: 'cap_capbank2',
    cap_capbank2c: 'cap_capbank2',
    cap_capbank3: 'cap_capbank3', // Can we make this the same as the others?
    '190-7361': 'reg_VREG4',
    '190-8581': 'reg_VREG3',
    '190-8593': 'reg_VREG2',
    '_hvmv_sub_lsb': 'reg_FEEDER_REG',
    'l2673313': 'nd_l2673313',
    'l2876814': 'nd_l2876814',
    'l2955047': 'nd_l2955047',
    'l3160107': 'nd_l3160107',
    'l3254238': 'nd_l3254238',
    'm1047574': 'nd_m1047574',
    reg_FEEDER_REG: 'reg_FEEDER_REG',
    reg_VREG2: 'reg_VREG2',
    reg_VREG3: 'reg_VREG3',
    reg_VREG4: 'reg_VREG4',
    xf_hvmv_sub: 'reg_FEEDER_REG'
  }
}

function getTimeseriesToPlotSeriesMappingNewFormat() {

  return {

    voltage_A: [
      '190-7361',
      '190-8581',
      '190-8593',
      '_hvmv_sub_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574',
    ],

    voltage_B: [
      '190-7361',
      '190-8581',
      '190-8593',
      '_hvmv_sub_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574',
    ],

    voltage_C: [
      '190-7361',
      '190-8581',
      '190-8593',
      '_hvmv_sub_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574',
    ],

    power_in_A: [
      'xf_hvmv_sub'
    ],

    power_in_B: [
      'xf_hvmv_sub'
    ],

    power_in_C: [
      'xf_hvmv_sub'
    ],

    tap_A: [
      'reg_FEEDER_REG',
      'reg_VREG2',
      'reg_VREG3',
      'reg_VREG4'
    ],

    tap_B: [
      'reg_FEEDER_REG',
      'reg_VREG2',
      'reg_VREG3',
      'reg_VREG4'
    ],

    tap_C: [
      'reg_FEEDER_REG',
      'reg_VREG2',
      'reg_VREG3',
      'reg_VREG4'
    ]
  }
}

function getTimeseriesToPlotSeriesMapping() {

  return {

    voltage_A: [
      'EOL_1_1_V',
      'EOL_1_2_V',
      'EOL_2_1_V',
      'EOL_2_2_V',
      'EOL_3_1_V',
      'EOL_4_1_V'
    ],

    voltage_B: [
      'EOL_1_1_V',
      'EOL_1_2_V',
      'EOL_2_1_V',
      'EOL_2_2_V',
      'EOL_3_1_V',
      'EOL_4_1_V'
    ],

    voltage_C: [
      'EOL_1_1_V',
      'EOL_1_2_V',
      'EOL_2_1_V',
      'EOL_2_2_V',
      'EOL_3_1_V',
      'EOL_4_1_V'
    ],

    power_in: [
      'feeder_power'
    ],

    tap_A: [
      'feeder_reg_taps',
      'reg_taps_2',
      'reg_taps_3',
      'reg_taps_4'
    ],

    tap_B: [
      'feeder_reg_taps',
      'reg_taps_2',
      'reg_taps_3',
      'reg_taps_4'
    ],

    tap_C: [
      'feeder_reg_taps',
      'reg_taps_2',
      'reg_taps_3',
      'reg_taps_4'
    ]
  }
}

app.get('/data/ieee8500/timeseries', (req, res) => {

  if (timeseriesData == null) {
    timeseriesData = getAllTimeseriesDataNewFormat();
  }

  if (timeseriesIndex >= timeseriesData.length) {
    timeseriesIndex = 0;
  }

  let json = {
    data: timeseriesData[timeseriesIndex++]
  };

  res.json(json);
});

console.log('Server running at: localhost ' + httpPort);