var subjector = require('../test_utils/subjector');
var Subject = subjector(__dirname + '/../ComponentInterpolator');

describe('ComponentInterpolator', function() {
  it('renders', function() {
    var subject = Subject({string: 'Hello World'});
    expect(subject.isMounted()).toEqual(true);
    expect(subject.getDOMNode().textContent).toEqual('Hello World');
  });

  it('escapes html in the string', function() {
    var subject = Subject({string: 'My favorite tag is <script />'});
    expect(subject.getDOMNode().textContent).toEqual('My favorite tag is <script />');
  });
});
