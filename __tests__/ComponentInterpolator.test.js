var React = require('react');
var { shallow } = require('enzyme');
var CI = require('../ComponentInterpolator');

describe('ComponentInterpolator', function() {
  it('renders', function() {
    var component = <CI string='Hello World'>$1</CI>;
    expect(shallow(component).text()).toEqual('Hello World');
  });

  it('wraps content in a <span>', function() {
    var component = <CI string='Howdy!'>$1</CI>;
    expect(shallow(component).html()).toEqual('<span>Howdy!</span>');
  });

  it('escapes html in the string', function() {
    var component = <CI string='My favorite tag is <script />'>$1</CI>;
    expect(shallow(component).text()).toEqual('My favorite tag is <script />');
  });

  it('interpolates wrapper components', function() {
    var props = {
      string: 'Ohai, Jane, click *here* right ***now **please** ***',
      wrappers: {
        '*': <a href='/'><img />$1</a>,
        '**': <i>$1</i>,
        '***': <b><em>$1</em></b>
      }
    };
    var component = <CI {...props}><hr />$1</CI>;
    expect(shallow(component).html()).toEqual(
      '<span><hr/>Ohai, Jane, click <a href="/"><img/>here</a> right <b><em>now <i>please</i> </em></b></span>'
    );
  });

  it('interpolates placeholder components', function() {
    var props = {
      string: 'Hi %{user} (%{user_id}), create %{count} new accounts',
      wrappers: {},
      user: "Jane",
      user_id: 0,
      count: <input />
  };
    var component = <CI {...props}>$1</CI>;
    expect(shallow(component).html()).toEqual(
      '<span>Hi Jane (0), create <input/> new accounts</span>'
    );
  });
});
