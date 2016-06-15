"use strict";

var ComponentInterpolator = require("../ComponentInterpolator");

var extend = function extend(I18n) {
  I18n.ComponentInterpolator = ComponentInterpolator;
};

module.exports = extend;