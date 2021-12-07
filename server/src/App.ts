import * as path from 'path';

import * as express from 'express';
import * as bodyParser from 'body-parser';

export class App {

  constructor(private readonly _expressInstance: express.Express) {
  }

  start() {
    this._addMiddlewares();
    this._expressInstance.get(['/'], (_, response) => response.sendFile('/index.html'));
    this._expressInstance.get('/config.json', (_, response) => response.sendFile('/config.json'));
  }

  private _addMiddlewares() {
    this._expressInstance.use(bodyParser.json());
    this._expressInstance.use(bodyParser.urlencoded({ extended: true }));
    this._expressInstance.use((_, response, next) => {
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    // __dirname is server/dist/src
    this._expressInstance.use(express.static(path.resolve(__dirname, '..', 'public')));
    this._expressInstance.use(express.static(path.resolve(__dirname, '..', '..', '..', 'assets')));
    this._expressInstance.use((_, response, next) => {
      response.redirect('/');
      next();
    });
  }

}
