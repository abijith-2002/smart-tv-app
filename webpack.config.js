const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // Entry point for the application
  entry: './src/index.js',

  // Output configuration
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.[contenthash].js',
    assetModuleFilename: 'assets/[hash][ext][query]',
    clean: true, // Clean the build folder before emit
    publicPath: '/', // Needed for proper historyApiFallback routing
  },

  mode: isProduction ? 'production' : 'development',

  // Enable appropriate source maps
  devtool: isProduction ? false : 'source-map',

  module: {
    rules: [
      // Handle CSS
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // Handle images and fonts with asset modules
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    // Generate the HTML from template
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      filename: 'index.html',
      inject: 'body',
    }),
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
      watch: true,
    },
    historyApiFallback: true, // SPA routing
    port: 3000,
    open: true,
    hot: true,
    client: {
      overlay: true,
    },
  },

  // Reasonable default for resolving
  resolve: {
    extensions: ['.js', '.json'],
  },
};
