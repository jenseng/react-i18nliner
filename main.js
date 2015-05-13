var fs = require("fs");
var preprocess = require("./preprocess");
var recast = require("recast");

module.exports = function(i18nliner) {
  var JsProcessor = i18nliner.processors.JsProcessor;
  var config = i18nliner.config;
  var origPreProcess = JsProcessor.prototype.preProcess;
  var hasTranslatableText = require("./hasTranslatableText")(config);

  JsProcessor.prototype.preProcess = function(source) {
    var fileData = origPreProcess.call(this, source);

    // avoid a parse if we can
    fileData.skip = fileData.skip && !hasTranslatableText(source);

    if (!fileData.skip) {
      var ast = fileData.ast || recast.parse(source, config.recastOptions);
      preprocess.ast(ast, config);
      fileData.ast = ast;
    }

    return fileData;
  };
};
