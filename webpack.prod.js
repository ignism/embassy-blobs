const merge = require('webpack-merge')
const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CleanWebpackPlugin = require('clean-webpack-plugin')
const common = require('./webpack.common.js')
const TerserPlugin = require('terser-webpack-plugin')

process.env.NODE_ENV = 'production'

module.exports = merge(common, {
  mode: 'production',

  plugins: [
    new BundleAnalyzerPlugin(),
    // new CleanWebpackPlugin(path.resolve(__dirname, 'www')),
  ],

  // optimization: {
  //   minimizer: [new TerserPlugin()],
  // },
})