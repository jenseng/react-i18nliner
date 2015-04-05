module.exports = function(path) {
  jest.dontMock(path);

  var React = require('react/addons');
  var { addons: { TestUtils } } = React;
  var Component = require(path);

  return function(props, children) {
    children = children || [];
    var args = [Component, props].concat(children);
    return TestUtils.renderIntoDocument(
      React.createElement.apply(React, args)
    );
  };
};

