const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TsConfigPathsPlugin = require('awesome-typescript-loader').TsConfigPathsPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = env => {
  const isProd = env === 'production';
  if (isProd)
    updateVersion();
  return {
    entry: {
      app: './src/main.tsx',
      vendors: './src/vendors.ts'
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[hash:10].js',
      publicPath: '',
    },


    resolve: {
      alias: {
        '@shared': path.resolve('./src/app/shared')
      },
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.scss', '.css', '.html']
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
      '@arg1=some-value-1',
      '@arg2=some-value-2',
      ...
    ]
  */
  const args = process.argv.slice(3);
  if (args.length === 0)
    childProcess.exec('git rev-parse --abbrev-ref HEAD', {}, (error, stdout) => {
      if (error)
        console.error(`An error occured trying to 'git rev-parse --abbrev-ref HEAD'`);
      else {
        const lastLine = stdout.trim().split('\n').slice(-1)[0];
        const lastIndexOfForwardSlash = lastLine.lastIndexOf('/');
        const versionNumber = lastLine.substr(lastIndexOfForwardSlash + 1);
        writeVersionNumber({ version: versionNumber });
      }
    });
  else {
    for (const [argName, argValue] of args.map(arg => arg.split('='))) {
      if (argName === '@version')
        writeVersionNumber({ version: argValue });
      else if (argName === '@host')
        writeVersionNumber({ host: argValue });
      else {
        console.error(`Unknown argument: ${argName.replace('@', '')}`);
        throw new Error();
      }
    }
  }
}

function writeVersionNumber({ version, host }) {
  const runConfigFileContent = fs.readFileSync('./runConfig.ts')
    .toString()
    .replace(/export\s+const\s+RUN_CONFIG\s+=\s+|;/g, '');
  const existingRunConfig = JSON.parse(runConfigFileContent);
  if (version)
    existingRunConfig.version = version;
  if (host)
    existingRunConfig.gossServerUrl = `ws://${host}`;

  fs.writeFileSync('./runConfig.ts', `export const RUN_CONFIG = ${JSON.stringify(existingRunConfig, null, 2)};`);
}