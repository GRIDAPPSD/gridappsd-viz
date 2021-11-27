Make sure that NodeJS is installed ([https://nodejs.org/en/](https://nodejs.org/en/))

# For development
## Bootstrapping the client
- `cd client`
- `npm install`
- `npm start` (Or `npm start disable-css-hmr` to disable CSS hot reload, theme toggle only works with this option disabled)
- Go to http://localhost:3000

## Bootstrapping the server
- `cd server`
- `npm install`
- `npm run nodemon` to start an HTTP server with hot-loading and TypeScript server in watch mode

# For deployment
## Building the front-end code
- `cd client`
- `npm install`
- `npm run build`

## Building the server code
- `cd server`
- `npm install`
- `npm run build`
- `npm start`

# Running the platform
- [Using GridAPPS-D](https://gridappsd.readthedocs.io/en/master/using_gridappsd/index.html)
- [Using the platform remotely](https://github.com/GRIDAPPSD/gridappsd-docker/blob/main/README.md)
