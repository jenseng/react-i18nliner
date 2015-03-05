jest.autoMockOff();
var subject = require('../preprocess');

describe('preprocess', function() {
  it('doesn\'t transform non-Translate elements', function() {
    expect(subject('<div />')).toEqual('<div />');
  });

  it('transforms Translate into ComponentInterpolator', function() {
    expect(subject('<Translate>hello</Translate>')).toEqual('<ComponentInterpolator string={I18n.t("hello")} />');
  });
});

