module.exports = {
  entry: [
    "./i18nliner-glue.js",
    "./entry.js"
  ],
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  node: {
    fs: 'empty',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: "jsx-loader!react-i18nliner/webpack-loader" },
      { test: /\.json$/, loader: "json-loader" }
    ],
    noParse: [
      /*
       * there's code in this file that dynamically requires plugins; it's
       * not needed in the browser, so we skip it ... otherwise webpack
       * will load *all* of i18nliner (which includes things like fs, and
       * will fail). TODO: make this unnecessary
       */
      /i18nliner\/dist\/lib\/i18nliner/
    ]
  }
};
