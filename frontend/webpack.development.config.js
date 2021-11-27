const { resolve } = require('path');

/**
 *
 * @param {{action: 'disable-css-hmr'}} env
 */
module.exports = (env) => {
  if (env.theme === undefined) {
    env.theme = 'dark';
  }
  const baseConfig = require('./webpack.base.config')('development', env.action !== 'disable-css-hmr', env.theme);
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
      'ts-loader'
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
      port: 3000,
      static: [
        resolve(__dirname, 'assets'),
        resolve(__dirname, 'dist')
      ],
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
