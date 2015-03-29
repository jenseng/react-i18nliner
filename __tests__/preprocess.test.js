jest.autoMockOff();
var preprocess = require('../preprocess');
var subject = function() {
  return preprocess.apply(null, arguments).replace(/\s+/g, ' ');
};

describe('preprocess', function() {
  it('doesn\'t transform non-translatable content', function() {
    expect(subject('<div>hello</div>')).toEqual('<div>hello</div>');
  });

  it('transforms translatable content', function() {
    expect(subject('<div translate="yes">hello</div>')).toEqual('<div>{I18n.t("hello")}</div>');
  });

  it('transforms translatable content with markup', function() {
    expect(subject('<div translate="yes">hello <b>world</b></div>')).toEqual('<div><ComponentInterpolator string={I18n.t("hello *world*")} wrappers={{ "*": <b /> }} /></div>');
  });

  it('creates placeholders for expressions', function() {
    expect(subject('<div translate="yes">hello {this.props.userName}</div>')).toEqual('<div><ComponentInterpolator string={I18n.t("hello %{user_name}")} user_name={this.props.userName} /></div>');
  });

  it('creates placeholders for components with no textContent', function() {
    expect(subject('<div translate="yes">Create <input /> new accounts</div>')).toEqual('<div><ComponentInterpolator string={I18n.t("Create %{input} new accounts")} input={<input />} /></div>');
  });

  it('ensures placeholders are unique', function() {
    expect(subject('<div translate="yes"><input /> vs <input /></div>')).toEqual('<div><ComponentInterpolator string={I18n.t("%{input} vs %{input1}")} input={<input />} input1={<input />} /></div>');
  });
});

