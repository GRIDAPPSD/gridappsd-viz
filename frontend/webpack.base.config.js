const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ExcludeAssetsPlugin = require('@ianwalter/exclude-assets-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

class RefReplacerPlugin {

  constructor() {
    this.previousLightThemeFilename = ''
    this.previousDarkThemeFilename = '';
  }

  apply(compiler) {
    const lightThemeStyleFilenameRef = '__LIGHT_THEME_STYLE_FILENAME__';
    const darkThemeStyleFilenameRef = '__DARK_THEME_STYLE_FILENAME__';
    const defaultSelectedThemeRef = '__DEFAULT_SELECTED_THEME__';

    compiler.hooks.emit.tap('RefReplacerPlugin', compilation => {
      const assetNames = compilation.getAssets().map(e => e.name);
      const mainChunkName = assetNames.find(e => e.startsWith('main') && e.endsWith('.js'));
      const hash = mainChunkName.split('.')[1];
      const newLightThemeFilename = `light.${hash}.css`;
      const newDarkThemeFilename = `dark.${hash}.css`;
      const sourceCode = compilation.assets[mainChunkName].source();
      let modifiedSourceCode = sourceCode;

      if (sourceCode.includes(lightThemeStyleFilenameRef)) {
        modifiedSourceCode = sourceCode
          .replace(lightThemeStyleFilenameRef, `"${newLightThemeFilename}"`)
          .replace(darkThemeStyleFilenameRef, `"${newDarkThemeFilename}"`)
          .replace(defaultSelectedThemeRef, '"dark"');
      } else {
        modifiedSourceCode = sourceCode
          .replace(this.previousLightThemeFilename, newLightThemeFilename)
          .replace(this.previousDarkThemeFilename, newDarkThemeFilename);
      }

      delete compilation.assets[`dark.${hash}.js`];
      delete compilation.assets[`dark.${hash}.js.map`];
      delete compilation.assets[`light.${hash}.js`];
      delete compilation.assets[`light.${hash}.js.map`];
      delete compilation.assets[`main.${hash}.css`];
      delete compilation.assets[`main.${hash}.css.map`];

      compilation.getAsset(mainChunkName).source.children = [
        {
          source() {
            return modifiedSourceCode;
          },
          size() {
            return modifiedSourceCode.length;
          }
        }
      ];

      this.previousLightThemeFilename = newLightThemeFilename;
      this.previousDarkThemeFilename = newDarkThemeFilename;
    });
  }
}

/**
 *
 * @param {'production' | 'development'} mode
 * @param {boolean} enableLogging
 */
module.exports = (mode, enableLogging) => ({
  mode,

  entry: createEntry(path.resolve(__dirname, 'src'), { main: `./src/main.${mode}.tsx`, dark: [], light: [] }),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash:10].js',
    chunkFilename: '[name].[hash:10].js',
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@shared': path.resolve('./src/app/shared'),
      '@common': path.resolve('../common'),
      '@constants.light': path.resolve('./src/constants.light.scss'),
      '@constants.dark': path.resolve('./src/constants.dark.scss')
    },
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.scss', '.css', '.html'],
    symlinks: false,
    plugins: [
      new TsConfigPathsPlugin()
    ]
  },

  module: {
    rules: [
      {
        test: /(\.tsx?)$/,
        use: 'awesome-typescript-loader'
      },
      {
        test: /\.scss/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ]
      },
      {
        test: /\.ttf$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: (filename, fullPath, context) => {
                const containingFolderPath = path.resolve(fullPath, '..');
                const containingFolderName = containingFolderPath.substring(containingFolderPath.lastIndexOf('/') + 1);
                return `assets/${containingFolderName}/${filename}`;
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new RefReplacerPlugin(),
    new HtmlWebpackPlugin({
      template: './template.html',
      excludeAssets: [
        /light\.[\w\d]+\.(?:css|js)/,
        /dark\.[\w\d]+\.js/,
        /main\.[\w\d]+\.css/
      ],
      minify: mode === 'production'
    }),
    new ExcludeAssetsPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[hash:10].css',
      chunkFilename: '[name].[hash:10].css'
    }),
    new webpack.DefinePlugin({
      __ENABLE_STOMP_CLIENT_LOGS__: JSON.stringify(enableLogging)
    })
  ],

  devtool: 'source-map',

  stats: 'errors-warnings'
});

function createEntry(parentPath, container) {
  const entries = fs.readdirSync(parentPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith('light.scss')) {
      container.light.push(path.resolve(parentPath, entry.name));
    } else if (entry.name.endsWith('dark.scss')) {
      container.dark.push(path.resolve(parentPath, entry.name));
    } else if (entry.isDirectory()) {
      createEntry(path.resolve(parentPath, entry.name), container);
    }
  }
  return container;
}
