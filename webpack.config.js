const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TsConfigPathsPlugin = require('awesome-typescript-loader').TsConfigPathsPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = env => {
  if (env === 'production')
    updateVersion();
  return {
    entry: {
      app: './src/main.tsx',
      vendors: './src/vendors.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[hash:10].js'
    },

    resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      alias: {
        '@shared': path.resolve('./src/app/shared')
      },
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.scss', '.css', '.html', '.web.js']
    },

    module: {
      rules: [{
        test: /(\.tsx?)$/,
        use: 'awesome-typescript-loader'
      },
      {
        test: /(\.s?css)$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader', 'sass-loader']
        })
      },
      { test: /\.(svg|png|woff|woff2|ttf|eot)$/, use: 'file-loader' },
      ]
    },
    plugins: [
      new TsConfigPathsPlugin(),
      new webpack.optimize.CommonsChunkPlugin({
        names: ['app', 'vendors', 'webpack-runtime']
      }),
      new HtmlWebpackPlugin({
        template: './index.template.html'
      }),
      new ExtractTextPlugin('[hash:10].css'),
      new CopyWebpackPlugin([
        {
          from: './src/assets',
          to: './assets'
        }
      ])
    ],

    devServer: {
      port: 4000,
      contentBase: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'dist')
      ],
      overlay: true,
      historyApiFallback: {
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
      }
    },
    devtool: 'source-map'
  };
};

function updateVersion() {
  /*
    process.argv returns an array of this form
    [
      '/path/to/node',
      '/path/to/webpack',
      '--env=production',
      '--env.BUILD_VERSION',
      'some-version',
    ]
  */
  if (process.argv.length === 5) {
    const buildVersionValue = process.argv.slice(-1)[0];
    writeVersionNumber(buildVersionValue);
  }
  else {
    childProcess.exec('git rev-parse --abbrev-ref HEAD', {}, (error, stdout) => {
      if (error)
        console.error(`An error occured trying to 'git rev-parse --abbrev-ref HEAD'`);
      else {
        const lastLine = stdout.trim().split('\n').slice(-1)[0];
        const lastIndexOfForwardSlash = lastLine.lastIndexOf('/');
        const versionNumber = lastLine.substr(lastIndexOfForwardSlash + 1);
        writeVersionNumber(versionNumber);
      }
    });
  }
}

function writeVersionNumber(versionNumber) {
  const runConfig = 'export const RUN_CONFIG = ' + JSON.stringify({
    'version': versionNumber,
    'gossServerUrl': 'ws://127.0.0.1:61614'
  }, null, 2) + ';\n';

  fs.writeFileSync('./runConfig.ts', runConfig);
}