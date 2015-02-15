/*
Given:

<Translate>Ohai {this.props.user}, click <Link>here</Link> right <b>now <i>please</i></b>!</Translate>

Pre-process it into:

<ComponentInterpolator string={I18n.t("Ohai, %{user}, click *here* right ***now **please** ***", {user: this.props.user})">
  <Link />
  <b><i /></b>
</ComponentInterpolator>
*/

var React = require('react');
var I18n = require('i18n');
var invariant = require('react/lib/invariant');
var { string } = React.PropTypes;

var OWN_PROPS = ['defaultValue', 'translateKey', 'children'];

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
      '<Translate> can only have one text child when not using pre-processing'
    );
    invariant(
      componentCount === 0,
      '<Translate> cannot have any component children when not using pre-processing'
    );
    invariant(
      textCount === 1 || this.props.defaultValue || this.props.translateKey,
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
