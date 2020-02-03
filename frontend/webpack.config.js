const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TsConfigPathsPlugin = require('awesome-typescript-loader').TsConfigPathsPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');

const darkThemeStyleExtractor = new ExtractTextPlugin('[hash:10].dark.css');
const lightThemeStyleExtractor = new ExtractTextPlugin('[hash:10].light.css');
const excludedThemeFilenamePattern = /(?:light\.css)$/;

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
      filename: '[name].[hash:10].js',
      publicPath: '/'
    },

    resolve: {
      alias: {
        '@shared': path.resolve('./src/app/shared'),
        '@commons': path.resolve('../commons'),
        '@constants.light': path.resolve('./src/constants.light.scss'),
        '@constants.dark': path.resolve('./src/constants.dark.scss')
      },
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.scss', '.css', '.html']
    },

    module: {
      rules: [
        {
          test: /(\.tsx?)$/,
          use: 'awesome-typescript-loader'
        },
        // Dark theme style extractor
        {
          test: function(filename) {
            return filename.endsWith('.dark.scss');
          },
          use: darkThemeStyleExtractor.extract({
            use: ['css-loader', 'sass-loader']
          })
        },
        // Light theme style extractor
        {
          test: function(filename) {
            return filename.endsWith('.light.scss');
          },
          use: lightThemeStyleExtractor.extract({
            use: ['css-loader', 'sass-loader']
          })
        },
        {
          test: /\.(svg|png|woff|woff2|ttf|eot)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                fallback: 'file-loader'
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new RefReplacerPlugin(),
      new TsConfigPathsPlugin(),
      new webpack.optimize.CommonsChunkPlugin({
        names: ['app', 'vendors', 'webpack-runtime']
      }),
      new HtmlWebpackPlugin({
        template: './index.template.html',
        excludeAssets: [excludedThemeFilenamePattern]
      }),
      new HtmlWebpackExcludeAssetsPlugin(),
      darkThemeStyleExtractor,
      lightThemeStyleExtractor,
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
      },
      open: true,
      proxy: {
        '/': {
          target: 'http://localhost:8092'
        }
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

let previousLightThemeFilename = ''
let previousDarkThemeFilename = '';
class RefReplacerPlugin {

  constructor() {
  }

  apply(compiler) {
    const lightThemeStyleFilenameRef = '__LIGHT_THEME_STYLE_FILENAME__';
    const darkThemeStyleFilenameRef = '__DARK_THEME_STYLE_FILENAME__';
    const defaultSelectedThemeRef = '__DEFAULT_SELECTED_THEME__';

    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-before-html-generation', (data, cb) => {
        const newLightThemeFilename = data.assets.css.find(stylesheetName => stylesheetName.includes('light'));
        const newDarkThemeFilename = data.assets.css.find(stylesheetName => stylesheetName.includes('dark'));

        compiler.plugin('emit', (data, cb) => {
          const appChunkName = Object.keys(data.assets)
            .find(assetName => assetName.startsWith('app') && assetName.endsWith('.js'));
          const app = data.assets[appChunkName];
          const sourceCode = app.children[0]._value;

          if (sourceCode.includes(lightThemeStyleFilenameRef)) {
            app.children[0]._value = sourceCode
              .replace(lightThemeStyleFilenameRef, `"${newLightThemeFilename}"`)
              .replace(darkThemeStyleFilenameRef, `"${newDarkThemeFilename}"`)
              .replace(defaultSelectedThemeRef, `"${excludedThemeFilenamePattern.source.includes('light') ? 'dark' : 'light'}"`);
          } else {
            app.children[0]._value = sourceCode
              .replace(previousLightThemeFilename, newLightThemeFilename)
              .replace(previousDarkThemeFilename, newDarkThemeFilename);
          }

          previousLightThemeFilename = newLightThemeFilename;
          previousDarkThemeFilename = newDarkThemeFilename;

          cb(null, data);
        });

        cb(null, data);
      });

    });
  }
}