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

var hasLiteralContent = function(node) {
  if (node.type === "Literal") return true;
  return node.children && node.children.some(function(child) {
    return hasLiteralContent(child);
  });
};

var findTranslatableIndex = findIndex.bind(null, isTranslatable);

var componentInterpolatorFor = function(string, wrappers) {
  var wrappersNode = b.objectExpression([]);
  for (key in wrappers) {
    wrappersNode.properties.push(b.property("init", b.literal(key), wrappers[key]))
  }
  return b.jsxElement(
    b.jsxOpeningElement(
      b.jsxIdentifier("ComponentInterpolator"),
      [
        b.jsxAttribute(
          b.jsxIdentifier("string"),
          b.jsxExpressionContainer(translateCallFor(string))
        ),
        b.jsxAttribute(
          b.jsxIdentifier("wrappers"),
          b.jsxExpressionContainer(wrappersNode)
        )
      ],
      true
    )
  );
};

var translateCallFor = function(string) {
  return b.callExpression(
    b.memberExpression(
      b.identifier("I18n"),
      b.identifier("t"),
      false
    ),
    [
      b.literal(string)
    ]
  );
};

var wrappedStringFor = function(node, wrappers, placeholders) {
  var delimiter = "*";
  while (wrappers[delimiter]) delimiter += "*";

  wrappers[delimiter] = node;
  var string = translateStringFor(node, wrappers, placeholders);
  node.children = [];
  node.openingElement.selfClosing = true;
  node.closingElement = null;

  return delimiter + string + delimiter;
};

var placeholderStringFor = function(node, placeholders) {
};

var translateStringFor = function(node, wrappers, placeholders) {
  var string = "";
  node.children.forEach(function(child) {
    if (child.type === "Literal")
      string += child.value;
    else if (hasLiteralContent(node))
      string += wrappedStringFor(child, wrappers);
    else
      string += placeholderStringFor(child, placeholders);
  });
  return string;
};

var translateExpressionFor = function(node) {
  var wrappers = {};
  var placeholders = {};
  var string = translateStringFor(node, wrappers, placeholders);
  var expression;
  if (wrappers["*"]) {
    return componentInterpolatorFor(string, wrappers);
  } else {
    return b.jsxExpressionContainer(translateCallFor(string, wrappers, placeholders));
  }
};

var transformations = {
  visitJSXElement(path) {
    var node = path.value;
    var attributes = node.openingElement.attributes;
    var translateIndex = findTranslatableIndex(attributes);
    if (translateIndex >= 0) {
      attributes.splice(translateIndex, 1);
      node.children = [translateExpressionFor(node)];
    }
    this.traverse(path);
  }
};

module.exports = function(source) {
  var ast = recast.parse(source);
  recast.visit(ast, transformations);
  return recast.print(ast).code;
};
