var I18nliner = require("i18nliner");
var config = I18nliner.config;
var preprocess = require("./preprocess");
var hasTranslatableText = require("./hasTranslatableText")(config);

module.exports = function(source) {
  this.cacheable();
  if (hasTranslatableText(source))
    source = preprocess(source, config);
  return source;
};
