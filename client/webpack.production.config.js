const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

/**
 *
 * @param {{ version: string }} env
 */
module.exports = (env) => {
  updateBuildVersion(env.version);
  const baseConfig = require('./webpack.base.config')('production');
  baseConfig.module.rules.push({
    test: /(\.tsx?)$/,
    use: 'ts-loader'
  });

  return {
    ...baseConfig,

    optimization: {
      splitChunks: {
        cacheGroups: {
          ...baseConfig.optimization.splitChunks.cacheGroups,
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
        new TerserPlugin({
          terserOptions: {
            sourceMap: true,
            compress: {
              drop_console: true
            }
          }
        }),
        new CssMinimizerPlugin()
      ]
    },

    stats: 'errors-only'
  };
};

/**
 *
 * @param {{buildVersion: string | true}} env if "buildVersion" is a string, then a build version string
 *                                               was provided, none provided otherwise, in that case, use current
 *                                               branch name as the build version
 */
function updateBuildVersion(version) {
  if (version !== undefined) {
    writeBuildVersion(version);
  } else {
    childProcess.exec('git rev-parse --abbrev-ref HEAD', {}, (error, stdout) => {
      if (error)
        console.error(`An error occured trying to 'git rev-parse --abbrev-ref HEAD'`);
      else {
        writeBuildVersion(stdout);
      }
    });
  }
}

function writeBuildVersion(version) {
  const configFilePath = path.resolve(__dirname, '..', 'assets', 'config.json')
  const config = JSON.parse(fs.readFileSync(configFilePath).toString());
  config.version = version.trim();
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
}
