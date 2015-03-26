var fs = require("fs");
var JsProcessor = require("i18nliner/dist/lib/processors/js_processor");
var preprocess = require("./preprocess");

JsProcessor.prototype.sourceFor = function(file) {
  return preprocess(fs.readFileSync(file).toString());
};

