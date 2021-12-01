const { resolve } = require('path');

module.exports = () => {
  const baseConfig = require('./webpack.base.config')('development');

  baseConfig.module.rules.push({
    test: /(\.tsx?)$/,
    use: 'ts-loader'
  });

  return {
    ...baseConfig,

    devServer: {
      port: 3000,
      open: true,
      hot: false,
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
      }
    }

  };
};
