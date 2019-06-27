'use strict';

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const httpPort = 8082;

app.use(express.static(__dirname));
app.use(express.static(path.resolve(__dirname, 'dist')));

app.use((_, response, next) => {
  response.redirect('/');
  next();
});

app.get(['/'], (_, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.get('/config.json', (_, response) => {
  response.sendFile(path.resolve(__dirname, 'config.json'));
});

server.listen(httpPort, () => `Server started on port ${httpPort} successfully`);
console.log(`Server started on port ${httpPort} successfully`);