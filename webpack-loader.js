var I18nliner = require("i18nliner").default;
var config = I18nliner.config;
var JsProcessor = require('i18nliner/dist/lib/processors/js_processor').default;
var parse = JsProcessor.prototype.parse;
var preprocess = require("./preprocess");
var hasTranslatableText = require("./hasTranslatableText")(config);

/*
 * there's code in this file that dynamically requires plugins; it's
 * not needed in the browser, so we skip it ... otherwise webpack
 * will load *all* of i18nliner (which includes things like fs, and
 * will fail).
 */
var noParsePath = "i18nliner/dist/lib/i18nliner";
var addNoParse = function() {
  var escapeRegExp = require("./util/escapeRegExp");
  var path = require("path");
  var mod = this.options.module;

  mod.noParse = mod.noParse || [];
  if (!Array.isArray(mod.noParse))
    mod.noParse = [mod.noParse];
  mod.noParse.push(new RegExp(escapeRegExp(path.normalize(noParsePath))));

  addNoParse = Function.prototype;
};

module.exports = function(source) {
  this.cacheable();
  addNoParse.call(this);
  if (hasTranslatableText(source))
    source = preprocess(parse(source), config);
  return source;
};
