var fs = require("fs");
var preprocess = require("./preprocess");
var recast = require("recast");

module.exports = function(i18nliner) {
  var JsProcessor = i18nliner.processors.JsProcessor;
  var config = i18nliner.config;
  JsProcessor.prototype.preProcess = function(source) {
    var ast = recast.parse(source, config.recastOptions);
    return {ast: preprocess.ast(ast, config)};
  };
};
