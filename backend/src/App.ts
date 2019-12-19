import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';

export class App {
  constructor(private readonly _expressServer: express.Express) {
    this._addMiddlewares();
  }

  private _addMiddlewares() {
    this._expressServer.use(bodyParser.json());
    this._expressServer.use(bodyParser.urlencoded({ extended: true }));
    this._expressServer.use((_, response, next) => {
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    // __dirname is backend/dist/backend/src
    this._expressServer.use(express.static(path.resolve(__dirname)));
    this._expressServer.use(express.static(path.resolve(__dirname, '../../../..')));
    this._expressServer.use((_, response, next) => {
      response.redirect('/');
      next();
    });
  }

  onIndex(cb: (request: express.Request, response: express.Response) => void) {
    this._expressServer.get('/', cb);
  }

  onGetConfigFile(cb: (request: express.Request, response: express.Response) => void) {
    this._expressServer.get('/config.json', cb);
  }

}
