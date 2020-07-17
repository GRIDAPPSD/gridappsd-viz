const path = require('path');

module.exports = (env) => {
  const baseConfig = require('./webpack.base.config')('development', true, env.action === 'enable-css-hmr');
  return {
    ...baseConfig,

    resolve: {
      ...baseConfig.resolve,
      alias: {
        ...baseConfig.resolve.alias,
        'react-dom': '@hot-loader/react-dom'
      }
    },

    devServer: {
      port: 4000,
      contentBase: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'dist')
      ],
      overlay: true,
      historyApiFallback: {
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
      },
      proxy: {
        '/': {
          target: 'http://localhost:8092'
        }
      },
      hot: true
    }

  };
};
