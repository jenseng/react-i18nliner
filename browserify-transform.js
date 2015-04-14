var through = require("through2");
var i18nliner = require("i18nliner");
var preprocess = require("./preprocess");

module.exports = function(file) {
  return through(function (buf, enc, next) {
    this.push(preprocess(buf.toString('utf8'), i18nliner.config));
    next();
  });
};
