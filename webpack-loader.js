var preprocess = require("./preprocess");

module.exports = function(source) {
  this.cacheable();
  return preprocess(source);
};
