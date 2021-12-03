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


# Application Code Architecture
The application is organized using a feature module based approach with smart/dumb component architecture. Each new feature will result in a new directory being created, directly under the feature module's directory, a component should be created, this component will become the **only** smart component of this feature. Inside the feature module directory, appropriate child directories should be added, and they are:
- **services** Contains all the Angular services that the module uses
- **models** Contains all of the required data structures and/or type declarations that describe the data models used within the module only
- **views** Contains components that handle rendering only, components inside **views** directory should not perform any network calls, these tasks should be delegated to the root component (*The only smart component of the module*) of the module, through the use of callback props.

Smart components are only responsible for data modeling and network calls, and this smart component will use the child components declared inside **views** directory to render all the necessary data that it handles, this creates a single of truth which makes it extremely easy to debug if the rendered data doesn't match expectations.