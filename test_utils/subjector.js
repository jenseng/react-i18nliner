module.exports = function(path) {
  jest.dontMock(path);

  var React = require('react');
  var TestUtils = require('react-addons-test-utils');
  var Component = require(path);

  return function(props, children) {
    children = children || [];
    var args = [Component, props].concat(children);
    return TestUtils.renderIntoDocument(
      React.createElement.apply(React, args)
    );
  };
};

