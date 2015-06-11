# webpack app

This is a basic webpack app localized in a few languages, demonstrating
the basic features of react-i18nliner.

## How do I run it?

1. `npm install`
2. `npm run build` (uses `./node_modules/.bin/webpack` from your dependencies)
3. `npm run extract` to generate sample json translations.
4. open index.html in a browser

## What's this stuff in config/locales?

Those are the localized strings; the current English strings can be
extracted from the json file by running `i18nliner export`. The idea is
you'd send that generated json file off to your translation service,
and incorporate the translated ones into your build.

Note that you *don't* have to put all translations into the same bundle
(that could get unwieldy fast); this is just a really basic example :)

## I changed an English string, now the translations stopped working :(

This is by design; if a string changes, you need to get it
re-translated :)
