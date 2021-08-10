const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ExcludeAssetsInHtmlPlugin = require('@ianwalter/exclude-assets-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

const { RefReplacerPlugin, NoOpPlugin, DeleteAssetsPlugin } = require('./webpack.plugins');

/**
 *
 * @param {'production' | 'development'} mode
 * @param {boolean} cssHmr Whether to enable CSS hot module reload
 */
module.exports = (mode, cssHmr) => ({
  mode,

  entry: createEntry(path.resolve(__dirname, 'src'), { main: `./src/main.${mode}.tsx`, dark: [], light: [] }),

  output: {
    path: path.resolve(__dirname, '..', 'backend', 'dist', 'public'),
    filename: `[name]${mode === 'development' ? '' : '.[contenthash]'}.js`,
    chunkFilename: `[id]${mode === 'development' ? '' : '.[contenthash]'}.js`,
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@shared': path.resolve('./src/app/shared'),
      '@common': path.resolve('../common'),
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
        type: 'asset/resource',
        generator: {
          filename: `assets/fonts/[name]${mode === 'development' ? '' : '.[hash]'}[ext]`
        }
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
    new DeleteAssetsPlugin([
      /light(?:\.[\w\d]+)?\.js/,
      /dark(?:\.[\w\d]+)?\.js/,
      /main(?:\.[\w\d]+)?\.css/
    ]),
    cssHmr ? new NoOpPlugin() : new RefReplacerPlugin(),
    new HtmlWebpackPlugin({
      template: './template.html',
      minify: mode === 'production',
      excludeAssets: [
        /light(?:\.[\w\d]+)?\.(?:css|js)/,
        /dark(?:\.[\w\d]+)?\.js/,
        /main(?:\.[\w\d]+)?\.css/
      ]
    }),
    new ExcludeAssetsInHtmlPlugin(),
    new MiniCssExtractPlugin({
      filename: `[name]${mode === 'development' ? '' : '.[contenthash]'}.css`,
      chunkFilename: `[id]${mode === 'development' ? '' : '.[contenthash]'}.css`
    }),
    new webpack.DefinePlugin({
      __DEVELOPMENT__: JSON.stringify(mode === 'development'),
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
