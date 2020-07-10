const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require('webpack');

const baseConfig = require('./webpack.base.config')('production');

/**
 *
 * @param {{ buildVersion: string | true; enableLogging?: boolean; }} env
 */
module.exports = (env) => {
  updateVersion(env);
  return {
    ...baseConfig,

    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false,
          vendors: false,
          dependencies: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            name: 'dependencies',
            priority: 20
          }
        }
      },
      minimize: true,
      minimizer: [
        new TerserJSPlugin({
          sourceMap: true,
          terserOptions: {
            compress: {
              drop_console: true
            }
          }
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },

    plugins: [
      ...baseConfig.plugins,
      new webpack.DefinePlugin({
        __ENABLE_STOMP_CLIENT_LOGS__: JSON.stringify(env.enableLogging !== undefined)
      })
    ],

    stats: 'errors-only'
  };
};

/**
 *
 * @param {{buildVersion: string | true}} env if "buildVersion" is a string, then a build version string
 *                                               was provided, none provided otherwise, in that case, use current
 *                                               branch name as the build version
 */
function updateVersion(env) {
  if (env.buildVersion !== true) {
    writeVersionNumber(env.buildVersion);
  } else {
    childProcess.exec('git rev-parse --abbrev-ref HEAD', {}, (error, stdout) => {
      if (error)
        console.error(`An error occured trying to 'git rev-parse --abbrev-ref HEAD'`);
      else {
        writeVersionNumber(stdout);
      }
    });
  }
}

function writeVersionNumber(versionNumber) {
  const configFilePath = path.resolve(__dirname, '..', 'config.json')
  const config = JSON.parse(fs.readFileSync(configFilePath).toString());
  config.version = versionNumber.trim();
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
}
