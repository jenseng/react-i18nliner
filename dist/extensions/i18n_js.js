var ComponentInterpolator = require("../ComponentInterpolator");

var extend = function(I18n) {
  I18n.ComponentInterpolator = ComponentInterpolator;
};

module.exports = extend;
