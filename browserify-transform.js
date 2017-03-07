var through = require("through2");
var I18nliner = require("i18nliner").default;
var config = I18nliner.config;
var JsProcessor = require('i18nliner/dist/lib/processors/js_processor').default;
var parse = JsProcessor.prototype.parse;
var preprocess = require("./preprocess");
var hasTranslatableText = require("./hasTranslatableText")(config);

module.exports = function() {
  return through(function (buf, enc, next) {
    var source = buf.toString('utf8');
    if (hasTranslatableText(source))
      source = preprocess(parse(source), config);
    this.push(source);
    next();
  });
};
