const path = require('path');

module.exports = {
           mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
           entry: './app/components/App.jsx',
           output: {
                      path: path.resolve(__dirname, 'dist'),
                      filename: 'bundle.js',
           },
           resolve: {
                      extensions: ['.js', '.jsx'],
                      fallback: {
                                 "path": require.resolve("path-browserify"),
                                 "fs": false,
                                 "stream": require.resolve("stream-browserify"),
                                 "buffer": require.resolve("buffer/")
                      }
           },
           module: {
                      rules: [
                                 {
                                            test: /\.(js|jsx)$/,
                                            exclude: /node_modules/,
                                            use: {
                                                       loader: 'babel-loader',
                                                       options: {
                                                                  presets: ['@babel/preset-env', '@babel/preset-react']
                                                       }
                                            }
                                 },
                                 {
                                            test: /\.css$/,
                                            use: ['style-loader', 'css-loader'],
                                 },
                      ],
           },
           externals: {
                      electron: 'commonjs electron'
           },
           devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
}; 