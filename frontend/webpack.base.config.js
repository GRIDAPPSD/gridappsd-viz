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
 * @param {boolean} enableStompClientLogging
 * @param {boolean} cssHmr Whether to enable CSS hot module reload
 */
module.exports = (mode, enableStompClientLogging, cssHmr) => ({
  mode,

  entry: createEntry(path.resolve(__dirname, 'src'), { main: `./src/main.${mode}.tsx`, dark: [], light: [] }),

  output: {
    path: path.resolve(__dirname, '..', 'backend', 'dist', 'public'),
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
        test: /\.scss/,
        use: [
          cssHmr ? 'style-loader' : MiniCssExtractPlugin.loader,
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
      filename: '[name].[hash:10].css',
      chunkFilename: '[name].[hash:10].css'
    }),
    new webpack.DefinePlugin({
      __STOMP_CLIENT_LOGGING_ENABLED__: JSON.stringify(enableStompClientLogging),
      __CSS_HMR_ENABLED__: JSON.stringify(cssHmr)
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
