# react-i18nliner

total WIP, not usable yet. the goal is this is something that works like [canvas_react_i18n](https://github.com/amireh/canvas_react_i18n), but:

1. more [i18nliner](https://github.com/jenseng/i18nliner-js)-y
2. really supports jsx inside `<Translate>` (instead of the current html-only and `{}` hacks). so you can use `className`, and actual components, and the wrapper magic will just work
3. actual runtime `<Translate>` component (not a `<div dangerouslySetInnerHTML=...`)
4. smart pre-processing, so that `<Translate>` will just become `{Translate.I18n.t(...)}` if it contains no markup
5. remove reliance on I18n global (or at least make it configurable)
