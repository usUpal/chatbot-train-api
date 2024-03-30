import path from 'path';
import nodeExternals from 'webpack-node-externals';

// const path = require('path');
// const nodeExternals = require('webpack-node-externals');

export default {
  entry: './src/app.js', // Entry point of your Express application
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'server.js' // Output file name
  },
  target: 'node', // Specify the target as Node.js
  externals: [nodeExternals()], // Exclude Node.js built-in modules from the bundle
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};