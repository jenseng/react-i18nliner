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

module.exports = function(config) {
  var pattern;

  return function(source) {
    pattern = pattern || getTranslatePattern(config);
    return !!source.match(pattern);
  };
};
