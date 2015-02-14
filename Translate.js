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
var invariant = require('react/lib/invariant');
var { string } = React.PropTypes;

OWN_PROPS = ['defaultValue', 'translateKey', 'children'];

var Translate = React.createClass({
  propTypes: {
    translateKey: string,
    defaultValue: string
  },

  componentWillMount() {
    var textCount = this.textCount();
    var componentCount = this.componentCount();
    invariant(
      textCount <= 1,
      '<Translate> can only have a one text child when not using pre-processing'
    );
    invariant(
      componentCount === 0 || textCount === 0,
      '<Translate> cannot have both text and component children when not using pre-processing'
    );
    invariant(
      textCount > 0 || this.props.defaultValue || this.props.translateKey,
      '<Translate> needs at least a translateKey, defaultValue, or text child'
    );
  },

  textCount(node) {
    node = node || this;
    count = 0;
    React.Children.forEach(node.props.children, function(child) {
      count += typeof child === 'string' ? 1 : this.textCount(child);
    });
    return count;
  },

  componentCount() {
    node = node || this;
    count = 0;
    React.Children.forEach(node.props.children, function(child) {
      count += typeof child === 'string' ? 0 : 1 + this.componentCount(child);
    });
    return count;
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
    var options = this.extraProps();
    var translateKey = this.props.translateKey;
    var defaultValue = this.props.defaultValue || this.props.children;
    options.defaultValue = defaultValue;

    var string = I18n.t(translateKey, options);
    var children = this.inferChildren(string, this.props.children);
    return React.createElement('span', {}, children);
  }
});

module.exports = Translate;
