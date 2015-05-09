var fs = require("fs");
var preprocess = require("./preprocess");
var recast = require("recast");

var escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var getTranslatePattern = function(config) {
  var pattern = 'translate=["\']yes["\']';
  var parts = config.autoTranslateTags || [];
  if (parts.length)
    pattern += "|<" + parts.map(escapeRegExp).join("|<");
  return new RegExp(pattern);
};

module.exports = function(i18nliner) {
  var JsProcessor = i18nliner.processors.JsProcessor;
  var config = i18nliner.config;
  var origPreProcess = JsProcessor.prototype.preProcess;
  var pattern;

  JsProcessor.prototype.preProcess = function(source) {
    var fileData = origPreProcess.call(this, source);
    pattern = pattern || getTranslatePattern(config);

    // avoid a parse if we can
    fileData.skip = fileData.skip && !source.match(pattern);

    if (!fileData.skip) {
      var ast = fileData.ast || recast.parse(source, config.recastOptions);
      preprocess.ast(ast, config);
      fileData.ast = ast;
    }

    return fileData;
  };
};
