/*
Given:

<Translate>Ohai {this.props.user}, click <Link>here</Link> right <b>now <i>please</i></b>!</Translate>

Pre-process it into:

<Translate translateKey="..." defaultValue="Ohai, %{user}, click *here* right ***now **please** ***" user={this.props.user}>
  <Link />
  <b><i /></b>
</Translate>
*/

var React = require('react');
var cloneWithProps = require('react/lib/cloneWithProps');

OWN_PROPS = ['defaultValue', 'translateKey', 'children'];

var Translate = React.createClass({
  componentWillMount() {
    // ensure defaultValue and N children w/ no text children at any levels
  },

  inferChildren(string, children) {
    var tokens = string.split(/(\*+)/);
    return this.interpolateChildren(tokens, children, result);
  },

  interpolateChildren(tokens, children, eof) {
    var token, child, newChildren = [];
    while (tokens.length) {
      token = tokens.shift();
      break if token === eof;
      if (token.match(/\*/)) {
        child = children.shift();
        child = cloneWithProps(child, {
          key: child.key,
          children: this.interpolateChildren(tokens, child.children, token)
        });
      }
      else {
        child = token;
      }
      newChildren.push(child);
    }
    return newChildren;
  },

  extraProps() {
    var props = {};
    for (var key in this.props) {
      if (OWN_PROPS.indexOf(key) === -1)
        props[key] = this.props[key];
    }
    return props;
  },

  render() {
    var string = I18n.t(this.props.translateKey, this.props);
    var children = this.inferChildren(string, this.props.children);
    return <span {...this.extraProps()}>{ children }</span>;
  }
});

module.exports = Translate;
