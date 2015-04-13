var i18nliner = require("i18nliner");
var preprocess = require("./preprocess");

module.exports = function(source) {
  this.cacheable();
  return preprocess(source, i18nliner);
};
