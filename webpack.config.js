import path from 'path';

export default {
  entry: './example/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('example/dist')
  },
  mode: 'development'
};