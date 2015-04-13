jest.autoMockOff();
var preprocess = require('../preprocess');
var subject = function() {
  return preprocess.apply(null, arguments).replace(/\s+/g, ' ');
};

describe('preprocess', function() {
  it('doesn\'t transform non-translatable content', function() {
    expect(subject('<div>hello</div>'))
          .toEqual('<div>hello</div>');
  });

  it('transforms translatable content', function() {
    expect(subject('<div translate="yes">hello</div>'))
          .toEqual('<div>{I18n.t("hello")}</div>');
  });

  it('transforms translatable content with markup', function() {
    expect(subject('<div translate="yes">hello <b>world</b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello *world*")} wrappers={{ "*": <b>$1</b> }}>$1</I18n.ComponentInterpolator></div>');
  });

  it('handles nested wrappers', function() {
    expect(subject('<div translate="yes">hello <b>to the <i>world</i></b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello *to the **world** *")} wrappers={{ "*": <b>$1</b>, "**": <i>$1</i> }}>$1</I18n.ComponentInterpolator></div>');
  });

  it('merges nested wrappers with no intermediate text content or expressions', function() {
    expect(subject('<div translate="yes">hello <b><i>world</i></b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello *world*")} wrappers={{ "*": <b><i>$1</i></b> }}>$1</I18n.ComponentInterpolator></div>');
  });

  it('merges leading and trailing standalone elements into wrappers', function() {
    expect(subject('<div translate="yes">hello <b><img />world</b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello *world*")} wrappers={{ "*": <b><img />$1</b> }}>$1</I18n.ComponentInterpolator></div>');
  });

  it('merges leading and trailing standalone elements into the translated element', function() {
    expect(subject('<div translate="yes"><img />hello<input /></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello")}><img />$1<input /></I18n.ComponentInterpolator></div>');
  });

  it('absorbs wrappers into placeholders if there is no other content', function() {
    expect(subject('<div translate="yes">hello <b>{user}</b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello %{user}", { "user": "%{user}" })} user={<b>{user}</b>}>$1</I18n.ComponentInterpolator></div>');
  });

  it('creates placeholders for expressions', function() {
    expect(subject('<div translate="yes">hello {this.props.userName}</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello %{user_name}", { "user_name": "%{user_name}" })} user_name={this.props.userName}>$1</I18n.ComponentInterpolator></div>');
  });

  it('creates placeholders for components with no textContent', function() {
    expect(subject('<div translate="yes">Create <input /> new accounts</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("Create %{input} new accounts", { "input": "%{input}" })} input={<input />}>$1</I18n.ComponentInterpolator></div>');
  });

  it('creates placeholders for translate="no" components', function() {
    expect(subject('<div translate="yes">to create an alert, type <code translate="no">alert()</code></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("to create an alert, type %{alert}", { "alert": "%{alert}" })} alert={<code>alert()</code>}>$1</I18n.ComponentInterpolator></div>');
  });

  it('auto-translates autoTranslateTags', function() {
    expect(subject('<h1>Hello World</h1>', {autoTranslateTags: ['h1']}))
          .toEqual('<h1>{I18n.t("Hello World")}</h1>');
  });

  it('doesn\'t translate autoTranslateTags with translate="no"', function() {
    expect(subject('<h1 translate="no">Hello World</h1>', {autoTranslateTags: ['h1']}))
          .toEqual('<h1>Hello World</h1>');
  });

  it('creates placeholders for neverTranslateTags', function() {
    expect(subject('<div translate="yes">If you type <code>alert()</code> you\'ll get an alert.</div>', {neverTranslateTags: ['code']}))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("If you type %{alert} you\'ll get an alert.", { "alert": "%{alert}" })} alert={<code>alert()</code>}>$1</I18n.ComponentInterpolator></div>');
  });

  it('translates neverTranslateTags with translate="yes"', function() {
    expect(subject('<div translate="yes">Monospaced text looks <code translate="yes">like this</code></div>', {neverTranslateTags: ['code']}))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("Monospaced text looks *like this*")} wrappers={{ "*": <code>$1</code> }}>$1</I18n.ComponentInterpolator></div>');
  });

  it('ensures placeholders are unique', function() {
    expect(subject('<div translate="yes">{<input />} vs {<input />}</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("%{input} vs %{input1}", { "input": "%{input}", "input1": "%{input1}" })} input={<input />} input1={<input />}>$1</I18n.ComponentInterpolator></div>');
  });
});

