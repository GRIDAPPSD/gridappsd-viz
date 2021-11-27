const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ExcludeAssetsPlugin = require('@ianwalter/exclude-assets-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

const { RefReplacerPlugin, NoOpPlugin } = require('./webpack.plugins');

/**
 *
 * @param {'production' | 'development'} mode
 * @param {boolean} cssHmr Whether to enable CSS hot module reload
 * @param {'dark' | 'light'} theme Dark theme or light theme? This option is ignored when mode is "production"
 */
module.exports = (mode, cssHmr, theme) => ({
  mode,

  entry: createEntry(path.resolve(__dirname, 'src'), { main: `./src/main.${mode}.tsx`, dark: [], light: [] }),

  output: {
    path: path.resolve(__dirname, '..', 'server', 'dist', 'public'),
    filename: '[name].[fullhash:10].js',
    chunkFilename: '[name].[fullhash:10].js',
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@client:common': path.resolve('./src/app/shared'),
      '@project:common': path.resolve('../common'),
      '@constants.common': path.resolve('./src/constants.common.scss'),
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
        test: /\.scss/,
        use: [
          cssHmr ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ]
      },
      {
        test: /\.(?:ttf|woff2)$/,
        type: 'asset/resource'
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    cssHmr ? new NoOpPlugin() : new RefReplacerPlugin(),
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
      filename: '[name].[fullhash:10].css',
      chunkFilename: '[name].[fullhash:10].css'
    }),
    new webpack.DefinePlugin({
      __DEVELOPMENT__: JSON.stringify(mode === 'development'),
      __CSS_HMR_ENABLED__: JSON.stringify(cssHmr),
      __THEME__: JSON.stringify(theme),
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
