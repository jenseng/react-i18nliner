jest.autoMockOff();
var preprocess = require('../preprocess');
var JsProcessor = require('i18nliner/dist/lib/processors/js_processor').default;

var subject = function() {
  var args = [].slice.apply(arguments);
  args[0] = JsProcessor.prototype.parse(args[0]);
  return preprocess.apply(null, args)
           .replace(/\s+/g, ' ')
           .replace(/;$/, '');
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

  it('doesn\'t merge leading or trailing standalone elements with keys', function() {
    expect(subject('<div translate="yes"><input key="user_1" /> versus <input key="user_2" /></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("%{user_1} versus %{user_2}", { "user_1": "%{user_1}", "user_2": "%{user_2}" })} user_1={<input key="user_1" />} user_2={<input key="user_2" />}>$1</I18n.ComponentInterpolator></div>');
  });

  it('absorbs wrappers into placeholders if there is no other content', function() {
    expect(subject('<div translate="yes">hello <b>{user}</b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello %{user}", { "user": "%{user}" })} user={<b>{user}</b>}>$1</I18n.ComponentInterpolator></div>');
  });

  it('uses the outermost key when absorbing wrappers into placeholders with no text content', function() {
    expect(subject('<div translate="yes">hello <b key="name">{user.name}</b></div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello %{name}", { "name": "%{name}" })} name={<b key="name">{user.name}</b>}>$1</I18n.ComponentInterpolator></div>');
  });

  it('creates placeholders for expressions', function() {
    expect(subject('<div translate="yes">hello {this.props.userName}</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("hello %{user_name}", { "user_name": "%{user_name}" })} user_name={this.props.userName}>$1</I18n.ComponentInterpolator></div>');
  });

  it('creates placeholders for components with no textContent', function() {
    expect(subject('<div translate="yes">Create <input /> new accounts</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("Create %{input} new accounts", { "input": "%{input}" })} input={<input />}>$1</I18n.ComponentInterpolator></div>');
  });

  it('uses the empty components\'s key as the placeholder name', function() {
    expect(subject('<div translate="yes">Create <input key="numAccounts" /> new accounts</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("Create %{num_accounts} new accounts", { "num_accounts": "%{num_accounts}" })} num_accounts={<input key="numAccounts" />}>$1</I18n.ComponentInterpolator></div>');
  });

  it('doesn\'t use the empty components\'s key as the placeholder name if it\'s not a literal', function() {
    expect(subject('<div translate="yes">Create <input key={something} /> new accounts</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("Create %{input_key_something} new accounts", { "input_key_something": "%{input_key_something}" })} input_key_something={<input key={something} />}>$1</I18n.ComponentInterpolator></div>');
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

  it('translates translatable attributes in translate="yes" components', function() {
    expect(subject('<a translate="yes" title="Your Account">Update Your Preferences</a>'))
          .toEqual('<a title={I18n.t("Your Account")}>{I18n.t("Update Your Preferences")}</a>');
  });

  it('doesn\'t translate non-literal translatable attributes in translate="yes" components', function() {
    expect(subject('<a translate="yes" title={someVar}>Update Your Preferences</a>'))
          .toEqual('<a title={someVar}>{I18n.t("Update Your Preferences")}</a>');
  });

  it('doesn\'t translate non-translatable attributes in a translate="yes" component', function() {
    expect(subject('<a translate="yes" href="/foo">Update Your Preferences</a>'))
          .toEqual('<a href="/foo">{I18n.t("Update Your Preferences")}</a>');
  });

  it('doesn\'t translate translatable attributes in translate="no" components', function() {
    expect(subject('<a translate="no" title="alert()">alert()</a>'))
          .toEqual('<a title="alert()">alert()</a>');
  });

  it('preserves (lack of) whitespace between adjacent wrappers and other content', function() {
    expect(subject('<div translate="yes"><b>{num}</b><i>%</i>, or approximately <i>$</i>{money}</div>'))
          .toEqual('<div><I18n.ComponentInterpolator string={I18n.t("%{num}*%*, or approximately **$**%{money}", { "num": "%{num}", "money": "%{money}" })} wrappers={{ "*": <i>$1</i>, "**": <i>$1</i> }} num={<b>{num}</b>} money={money}>$1</I18n.ComponentInterpolator></div>');
  });
});

