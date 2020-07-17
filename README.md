Make sure that NodeJS is installed ([https://nodejs.org/en/](https://nodejs.org/en/))

# For development
## Bootstrapping the front-end
- `cd frontend`
- `npm install`
- `npm start` (Or `npm start enable-css-hmr` to enable CSS hot reload, theme toggle won't work with this option enabled)
- Go to http://localhost:4000

## Bootstrapping the back-end
- `cd backend`
- `npm install`
- `npm run nodemon` to start an HTTP server with hot-loading and TypeScript server in watch mode

# For deployment
## Building the front-end code
- `cd frontend`
- `npm install`
- `npm run build`

## Building the back-end code
- `cd backend`
- `npm install`
- `npm run build`
- `npm start`
