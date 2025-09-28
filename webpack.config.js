const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode:'production',
  entry: path.join(__dirname, 'build','test.js'),
  output: {
    path: path.resolve(__dirname, 'static'),
    filename: 'webpack.bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',  // 指定HTML模板文件
      filename: 'index.html'   // 输出的HTML文件名
    })
  ],
  devServer:{
    static: {
      directory: path.resolve(__dirname, 'static')
    },
    open:true,
    port:8080
  }
};