var fs = require("fs");
var preprocess = require("./preprocess");

module.exports = function(i18nliner) {
  var JsProcessor = i18nliner.processors.JsProcessor;
  JsProcessor.prototype.sourceFor = function(file) {
    return preprocess(fs.readFileSync(file).toString());
  };
}
