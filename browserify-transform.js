var through = require("through2");
var I18nliner = require("i18nliner");
var config = I18nliner.config;
var preprocess = require("./preprocess");
var hasTranslatableText = require("./hasTranslatableText")(config);

module.exports = function() {
  return through(function (buf, enc, next) {
    var source = buf.toString('utf8');
    if (hasTranslatableText(source))
      source = preprocess(source, config);
    this.push(source);
    next();
  });
};
