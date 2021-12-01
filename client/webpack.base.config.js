const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ExcludeAssetsPlugin = require('@ianwalter/exclude-assets-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

const { RefReplacerPlugin } = require('./webpack.plugins');

/**
 *
 * @param {'production' | 'development'} mode
 */
module.exports = (mode) => ({
  mode,

  entry: createEntry(path.resolve(__dirname, 'src'), { main: './src/main.tsx', dark: [], light: [] }),

  output: {
    path: path.resolve(__dirname, '..', 'server', 'dist', 'public'),
    filename: '[name].[fullhash:10].js',
    chunkFilename: '[name].[fullhash:10].js',
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@client:common': path.resolve('./src/app/common'),
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
          MiniCssExtractPlugin.loader,
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

  optimization: {
    splitChunks: {
      cacheGroups: {
        light: {
          type: 'css/mini-extract',
          test: /light\.css$/,
          chunks: 'all',
          enforce: true
        },
        dark: {
          type: 'css/mini-extract',
          test: /dark\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    },
    minimize: false
  },

  plugins: [
    new CleanWebpackPlugin(),
    new RefReplacerPlugin(),
    new ExcludeAssetsPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[fullhash:10].css',
      chunkFilename: '[name].[fullhash:10].css'
    }),
    new webpack.DefinePlugin({
      __DEVELOPMENT__: JSON.stringify(mode === 'development')
    }),
    new HtmlWebpackPlugin({
      template: './template.html',
      minify: mode === 'production',
      excludeAssets: [
        /light\.[\w\d]+\.(?:css|js)/,
        /dark\.[\w\d]+\.js/,
        /main\.[\w\d]+\.css/
      ],
      minify: mode === 'production',
      publicPath: '/'
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
