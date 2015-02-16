var subjector = require('../test_utils/subjector');
var Subject = subjector(__dirname + '/../ComponentInterpolator');
var React = require('react');

var removeNoise = function(string) {
  return string.replace(/<span.*?>|<\/span>/g, '')
               .replace(/ data-reactid=".*?"/g, '');
};

describe('ComponentInterpolator', function() {
  it('renders', function() {
    var subject = Subject({
      string: 'Hello World',
      wrappers: {}
    });
    expect(subject.isMounted()).toEqual(true);
    expect(subject.getDOMNode().textContent).toEqual('Hello World');
  });

  it('escapes html in the string', function() {
    var subject = Subject({
      string: 'My favorite tag is <script />',
      wrappers: {}
    });
    expect(subject.getDOMNode().textContent).toEqual('My favorite tag is <script />');
  });

  it('interpolates components', function() {
    var subject = Subject({
      string: 'Ohai, Jane, click *here* right ***now **please** ***',
      wrappers: {
        '*': <a href='/'/>,
        '**': <i/>,
        '***': <b/>
      }
    });
    expect(removeNoise(subject.getDOMNode().innerHTML)).toEqual(
      'Ohai, Jane, click <a href="/">here</a> right <b>now <i>please</i> </b>'
    );
  });
});
