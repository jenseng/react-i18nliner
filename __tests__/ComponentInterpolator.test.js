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
    }, ["$1"]);
    expect(subject.isMounted()).toEqual(true);
    expect(subject.getDOMNode().textContent).toEqual('Hello World');
  });

  it('escapes html in the string', function() {
    var subject = Subject({
      string: 'My favorite tag is <script />',
      wrappers: {}
    }, ["$1"]);
    expect(subject.getDOMNode().textContent).toEqual('My favorite tag is <script />');
  });

  it('interpolates wrapper components', function() {
    var subject = Subject({
      string: 'Ohai, Jane, click *here* right ***now **please** ***',
      wrappers: {
        '*': <a href='/'><img />$1</a>,
        '**': <i>$1</i>,
        '***': <b><em>$1</em></b>
      }
    }, [<hr />, "$1"]);
    expect(removeNoise(subject.getDOMNode().innerHTML)).toEqual(
      '<hr>Ohai, Jane, click <a href="/"><img>here</a> right <b><em>now <i>please</i> </em></b>'
    );
  });

  it('interpolates placeholder components', function() {
    var subject = Subject({
      string: 'Hi %{user} (%{user_id}), create %{count} new accounts',
      wrappers: {},
      user: "Jane",
      user_id: 0,
      count: <input />
    }, ["$1"]);
    expect(removeNoise(subject.getDOMNode().innerHTML)).toEqual(
      'Hi Jane (0), create <input> new accounts'
    );
  });
});
