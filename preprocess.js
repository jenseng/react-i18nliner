var recast = require('recast');
var b = recast.types.builders;

var transformations = {
  visitJSXElement(path) {
    var node = path.value;
    if (node.openingElement.name.name === "Translate") {
      var string = node.children[0].value;
      node.openingElement.name.name = "ComponentInterpolator";
      node.openingElement.selfClosing = true;
      node.openingElement.attributes.push(
        b.jsxAttribute(
          b.jsxIdentifier("string"),
          b.jsxExpressionContainer(
            b.callExpression(
              b.memberExpression(
                b.identifier("I18n"),
                b.identifier("t"),
                false
              ),
              [
                b.literal(string)
              ]
            )
          )
        )
      );
      node.closingElement = null;
      node.children = [];
    }
    this.traverse(path);
  }
};

module.exports = function(source) {
  var ast = recast.parse(source);
  recast.visit(ast, transformations);
  return recast.print(ast).code;
};
