module.exports = function(path) {
  jest.dontMock(path);

  var React = require('react/addons');
  var { addons: { TestUtils } } = React;
  var Component = require(path);

  return function(props) {
    return TestUtils.renderIntoDocument(
      React.createElement(Component, props)
    );
  };
};

