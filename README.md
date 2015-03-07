# react-i18nliner

total WIP, not usable yet. inspired by [canvas_react_i18n](https://github.com/amireh/canvas_react_i18n), but even better:

1. just put a `translate="on"` property on *any* element/component. no
   need for a `<Text>`/`<Translate>` component
2. really supports jsx inside translatable components (instead of the
   canvas_react_i18n's html-only and `{}` hacks). so you can use
   `className`, and actual components, and the wrapper magic will just
   work
3. smart pre-processing that either convert translatable component's
   content to {I18n.t(...)} (if no nested markup/components), or a
   `<ComponentInterpolator>` that does the wrapper fu for you.
4. remove reliance on I18n global (or at least make it configurable)
