module.exports = {
  entry: [
    "./i18nliner-glue.js",
    "./entry.js"
  ],
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: "jsx-loader!react-i18nliner/webpack-loader" },
      { test: /\.json$/, loader: "json-loader" }
    ]
  }
};
