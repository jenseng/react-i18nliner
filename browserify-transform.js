var through = require("through2");
var preprocess = require("./preprocess");

module.exports = function(file) {
  return through(function (buf, enc, next) {
    this.push(preprocess(buf.toString('utf8')));
    next();
  });
};
