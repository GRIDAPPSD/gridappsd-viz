const { resolve } = require('path');

/**
 *
 * @param {{action: 'enable-css-hmr'}} env
 */
module.exports = (env) => {
  const baseConfig = require('./webpack.base.config')('development', env.action !== 'disable-css-hmr');
  baseConfig.module.rules.push({
    test: /(\.tsx?)$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          plugins: [
            'react-hot-loader/babel'
          ]
        }
      },
      'awesome-typescript-loader'
    ]
  });

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
        resolve(__dirname, 'assets'),
        resolve(__dirname, 'dist')
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
