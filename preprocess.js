var recast = require('recast');
var b = recast.types.builders;

var PLACEHOLDER_PATTERN = /(%\{.*?\})/;

var interpolatorName = "I18n.ComponentInterpolator";

var findIndex = function(fn, ary) {
  for (var i = 0; i < ary.length; i++) {
    if (fn(ary[i]))
      return i;
  }
  return -1;
};

var hasLiteralContent = function(node) {
  if (node.type === "Literal") return true;
  if (node.type !== "JSXElement") return false;
  if (extractTranslateAttribute(node) === "no") return false;
  return node.children && node.children.some(function(child) {
    return hasLiteralContent(child);
  });
};

var findTranslateIndex = findIndex.bind(null, function(attribute) {
  return attribute.name && attribute.name.name === "translate";
});

var extractTranslateAttribute = function(node) {
  var attributes = node.openingElement.attributes;
  var translateIndex = findTranslateIndex(attributes);
  var translate;
  if (translateIndex >= 0) {
    translate = attributes[translateIndex].value.value;
    attributes.splice(translateIndex, 1);
  }
  return translate;
};

var componentInterpolatorFor = function(string, wrappers, placeholders) {
  var properties = [];
  var key;
  properties.push(
    b.jsxAttribute(
      b.jsxIdentifier("string"),
      b.jsxExpressionContainer(translateCallFor(string))
    )
  );

  if (Object.keys(wrappers).length) {
    var wrappersNode = b.objectExpression([]);
    for (key in wrappers) {
      wrappersNode.properties.push(b.property("init", b.literal(key), wrappers[key]));
    }
    properties.push(
      b.jsxAttribute(
        b.jsxIdentifier("wrappers"),
        b.jsxExpressionContainer(wrappersNode)
      )
    );
  }

  for (key in placeholders) {
    var value = placeholders[key];
    if (value.type !== "JSXExpressionContainer")
      value = b.jsxExpressionContainer(placeholders[key]);
    properties.push(
      b.jsxAttribute(
        b.jsxIdentifier(key),
        value
      )
    );
  }

  var children = [];
  children.push(b.literal("$1"));

  return b.jsxElement(
    b.jsxOpeningElement(
      b.jsxIdentifier(interpolatorName),
      properties
    ),
    b.jsxClosingElement(
      b.jsxIdentifier(interpolatorName)
    ),
    children
  );
};

var translateCallFor = function(string) {
  var args = [
    b.literal(string)
  ];

  // create dummy placeholders; we want ComponentInterpolator to do the
  // actual interpolation. we don't want I18n.t to strip placeholders or
  // error out due to missing values
  var tokens = string.split(PLACEHOLDER_PATTERN);
  if (tokens.length > 1) {
    var optionsNode = b.objectExpression([]);
    while (tokens.length) {
      var token = tokens.shift();
      if (token.match(PLACEHOLDER_PATTERN)) {
        optionsNode.properties.push(b.property("init", b.literal(token.slice(2, -1)), b.literal(token)));
      }
    }
    args.push(optionsNode);
  }

  return b.callExpression(
    b.memberExpression(
      b.identifier("I18n"),
      b.identifier("t"),
      false
    ),
    args
  );
};

var wrappedStringFor = function(node, wrappers, placeholders) {
  var delimiter = "*";
  while (wrappers[delimiter]) delimiter += "*";

  wrappers[delimiter] = node;
  var innerNode = findInnerNodeFor(node);
  var string = translateStringFor(innerNode, wrappers, placeholders);
  innerNode.children = ["$1"];

  return " " + delimiter + string + delimiter + " ";
};

var findInnerNodeFor = function(node) {
  var nodesWithText = node.children.filter(hasLiteralContent);
  if (nodesWithText.length === 1 && nodesWithText[0].type === "JSXElement")
    return nodesWithText[0];
  else
    return node;
};

var placeholderStringFor = function(node, placeholders) {
  var source = recast.print(node).code;
  var placeholderBase = source.replace(/<\/[^>]+>/g, '')
                              .replace(/[^A-Za-z0-9]/g, ' ')
                              .replace(/([A-Z]+)?([A-Z])/g, '$1 $2')
                              .toLowerCase()
                              .trim()
                              .replace(/\s+/g, '_')
                              .replace(/^this_((state|props)_)/, '');
  var placeholder = placeholderBase;
  var i = 0;
  while (placeholders[placeholder]) {
    placeholder = placeholderBase + (++i);
  }
  placeholders[placeholder] = node;
  return "%{" + placeholder + "}";
};

var translateStringFor = function(node, wrappers, placeholders) {
  var string = "";
  node.children.forEach(function(child) {
    if (child.type === "Literal")
      string += child.value;
    else if (hasLiteralContent(child))
      string += wrappedStringFor(child, wrappers, placeholders);
    else
      string += placeholderStringFor(child, placeholders);
  });
  return string;
};

var translateExpressionFor = function(node) {
  var wrappers = {};
  var placeholders = {};
  var string = translateStringFor(node, wrappers, placeholders)
                .replace(/ +/g, ' ')
                .trim();
  var expression;
  if (Object.keys(wrappers).length || Object.keys(placeholders).length) {
    return componentInterpolatorFor(string, wrappers, placeholders);
  } else {
    return b.jsxExpressionContainer(translateCallFor(string, wrappers, placeholders));
  }
};

var transformations = {
  visitJSXElement: function(path) {
    var node = path.value;
    if (extractTranslateAttribute(node) === "yes") {
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
