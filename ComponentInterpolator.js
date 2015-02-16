/**
 * Given:
 *
 * <Translate>Ohai {this.props.user}, click <Link>here</Link> right <b>now <i>please</i></b>!</Translate>
 *
 * Pre-process it into:
 *
 * <ComponentInterpolator
 *   string={I18n.t("Ohai, %{user}, click *here* right ***now **please** ***", {user: this.props.user})"
 *   wrappers={{
 *     '*': <Link/>,
 *     '**': <b/>,
 *     '***': <i/>}}
 * />
 *
 * Which is equivalent to:
 *
 * <span>Ohai {this.props.user}, click <Link>here</Link> right <b>now <i>please</i></b>!</span>
 *
 * ... but completely localizable :)
 */

var React = require('react');
var cloneWithProps = require('react/lib/cloneWithProps');
var invariant = require('react/lib/invariant');
var { string, object } = React.PropTypes;

var ComponentInterpolator = React.createClass({
  propTypes: {
    string: string.isRequired,
    wrappers: object.isRequired
  },

  componentWillMount() {
    invariant(
      !this.props.children,
      '<ComponentInterpolator> cannot have any children'
    );
  },

  inferChildren() {
    var tokens = (this.props.string || '').split(/(\*+)/);
    return this.interpolateComponents(tokens);
  },

  interpolateComponents(tokens, eof) {
    var token, child
    var children = [];
    var wrappers = this.props.wrappers || {};
    while (tokens.length) {
      token = tokens.shift();
      if (token === eof) break;
      if (token.match(/\*/)) {
        invariant(
          child = wrappers[token],
          `<ComponentInterpolator>'s string expected ${token} wrapper, none found`
        )
        child = cloneWithProps(child, {
          key: token,
          children: this.interpolateComponents(tokens, token)
        });
      }
      else {
        child = token;
      }
      children.push(child);
    }
    return children;
  },

  render() {
    return React.createElement('span', {}, this.inferChildren());
  }
});

module.exports = ComponentInterpolator;

