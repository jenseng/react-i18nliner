var recast = require('recast');
var b = recast.types.builders;

var findIndex = function(fn, ary) {
  for (var i = 0; i < ary.length; i++) {
    if (fn(ary[i]))
      return i;
  }
  return -1;
};

var isTranslatable = function(attribute) {
  return attribute.name.name === "translate" &&
    attribute.value.value === "yes";
};

var findTranslatableIndex = findIndex.bind(null, isTranslatable);

var translateExpressionFor = function(children) {
  /*var string = node.children[0].value;
  node.openingElement.name.name = "ComponentInterpolator";
  node.openingElement.selfClosing = true;
  node.openingElement.attributes.push(
    b.jsxAttribute(
      b.jsxIdentifier("string"),
      b.jsxExpressionContainer(
      )
    )
  );*/
  return b.jsxExpressionContainer(
    b.callExpression(
      b.memberExpression(
        b.identifier("I18n"),
        b.identifier("t"),
        false
      ),
      [
        b.literal(children[0].value)
      ]
    )
  );
};

var transformations = {
  visitJSXElement(path) {
    var node = path.value;
    var attributes = node.openingElement.attributes;
    var translateIndex = findTranslatableIndex(attributes);
    if (translateIndex >= 0) {
      attributes.splice(translateIndex, 1);
      node.children = [translateExpressionFor(node.children)];
    }
    this.traverse(path);
  }
};

module.exports = function(source) {
  var ast = recast.parse(source);
  recast.visit(ast, transformations);
  return recast.print(ast).code;
};
