'use strict'
const utils = require('./utils')
const config = require('../config')
const isProduction = process.env.NODE_ENV === 'production'
const sourceMapEnabled = isProduction
  ? config.build.productionSourceMap
  : config.dev.cssSourceMap

module.exports = {
  loaders: utils.cssLoaders({
    sourceMap: sourceMapEnabled,
    extract: isProduction,
    // scss: [
    //   'vue-style-loader',
    //   'css-loader',
    //   {
    //     loader: 'sass-loader',
    //     options: {
    //       includePaths: [
    //         'src/styles',
    //       ],
    //     },
    //   },
    //   {
    //     loader: 'sass-resources-loader',
    //     options: {
    //       // Provide path to the file with resources
    //       resources: ['./src/styles/variables.scss'],
    //     },
    //   },
    // ],
  }),
  cssSourceMap: sourceMapEnabled,
  cacheBusting: config.dev.cacheBusting,
  transformToRequire: {
    video: ['src', 'poster'],
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}
