jest.autoMockOff();
var subject = require('../preprocess');

describe('preprocess', function() {
  it('doesn\'t transform non-Translate elements', function() {
    expect(subject('<div />')).toEqual('<div />');
  });

  // TODO: don't do a ComponentInterpolator unless there are actually components
  it('transforms Translate into ComponentInterpolator', function() {
    expect(subject('<Translate>hello</Translate>')).toEqual('<ComponentInterpolator string={I18n.t("hello")} />');
  });

  it('concatenates child literals');

  it('creates placeholders for expressions');

  it('creates placeholders for components with no textContent')

  it('ensures placeholders are unique');

  it('creates wrappers for components with textContent');

  it('reuses wrappers for identical components');
});

