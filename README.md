# react-i18nliner

## todo

1. figure out how to ensure runtime dependency ... perhaps extraction error
   if `I18n` isn't in scope (though you could have setting to say you want
   a global)
2. create placeholders for translate="no"
3. implement processor and register w/ i18nliner

====

react-i18nliner brings [I18nliner](https://github.com/jenseng/i18nliner-js)
to React via the [html `translate` attribute](http://www.w3.org/International/questions/qa-translate-flag). I18n doesn't get any easier than this.

## TL;DR

react-i18nliner lets you do this:

```html
<p translate="yes">
  Hey {this.props.user.name}!
  Although I am <Link to="route">linking to something</Link> and
  have some <strong>bold text</strong>, the translators will see
  <strong><em>absolutely no markup</em></strong> and will only have a
  single string to translate :o
</p>
```

Write your components as you normally would, and just put a
`translate="yes"` attribute on any element/component that needs to be
localized.

Best of all, you don't need to maintain translation files anymore;
I18nliner will do it for you.

## How does it work?

react-i18nliner preprocesses your JSX, transforming it into something
truly localizable. It infers placeholders for expressions and
[wrappers](https://github.com/jenseng/i18nliner-js)
for elements/components, and separates the localizable string. At runtime
it localizes the string, interpolating the wrappers and placeholders into
the correct locations.

react-i18nliner also adds an extractor to I18nliner, so that you can
extract all translatable strings from your codebase for translation. Once
translated, just put them on `window.I18n.translations` and everything
will Just Work™.

## Installation

TODO: depends on [this feature](https://github.com/jenseng/i18nliner-js/issues/12) ... until then you need some glue code.

```bash
npm install i18nliner react-i18nliner --save
```

And make sure your `.i18nrc` file has:

```json
{
  "plugins": {
    "react-i18nliner": true
  }
}
```

TODO: figure out registering w/ runtime extension

TODO: instructions for browserify/webpack
