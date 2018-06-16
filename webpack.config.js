const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/app/index.tsx',
    vendors: './src/vendors.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[hash:10].js'
    // Adding publicPath fixes font loading problem
    // http://stackoverflow.com/questions/34133808/webpack-ots-parsing-error-loading-fonts
    // publicPath: "http://localhost:8082/dist"
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.scss', '.css', '.html', ".web.js"]
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
      { test: /\.(svg|png|woff|woff2|ttf|eot)$/, use: "file-loader" },
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      names: ['app', 'vendors', 'webpack-runtime']
    }),
    new HtmlWebpackPlugin({
      template: './index.template.html'
    }),
    new ExtractTextPlugin('[hash:10].css')
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