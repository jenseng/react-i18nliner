var recast = require('recast');
var b = recast.types.builders;

// http://www.w3.org/TR/html5/dom.html#the-translate-attribute
// everything per the spec, except:
//   iframe.srcdoc  -- yeesh, no thanks
//   html.lang      -- *you* should set that)
//   *.style        -- not a string literal in react-land, also not worth
//                     the trouble just to translate `content` props
//
var translatableAttributes = {
  "abbr":        ["th"],
  "alt":         ["area", "img", "input"],
  "content":     ["meta"],
  "download":    ["a", "area"],
  "label":       ["optgroup", "option", "track"],
  "placeholder": ["input", "textarea"],
  "title":       function() { return true; },
  "value":       function(node) {
                   if (node.name.name !== "input")
                     return false;
                   var type = findAttribute("type", false, node).toLowerCase();
                   return type === "button" || type === "reset";
                 }
};

var isTranslatableAttribute = function(node, attribute) {
  var name = attribute.name.name;
  if (!translatableAttributes[name]) return false;
  if (attribute.value.type !== "Literal") return false;

  var rules = translatableAttributes[name];
  if (typeof rules === "function")
    return rules(node);
  else
    return rules.indexOf(node.name.name) >= 0;
};

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
  return node.children && node.children.some(hasLiteralContent);
};

var hasNonJSXDescendants = function(node) {
  switch (node.type){
    case "JSXElement":
      return node.children && node.children.some(hasNonJSXDescendants);
    case "JSXExpressionContainer":
      return hasNonJSXDescendants(node.expression);
    case "JSXEmptyExpression":
      return false;
    default:
      return true;
  }
};

var findNestedJSXExpressions = function(node, expressions) {
  expressions = expressions || [];
  if (node.type === "JSXExpressionContainer") {
    expressions.push(node);
  } else if (node.type === "JSXElement") {
    node.children.forEach(function(child) {
      findNestedJSXExpressions(child, expressions);
    });
  }
  return expressions;
};

var findAttributeIndex = function(name, array) {
  return findIndex(function(attribute) {
    return attribute.name && attribute.name.name === name;
  }, array);
};

var findAttribute = function(attribute, node, shouldSpliceFn) {
  if (node.type !== "JSXElement") return;

  var attributes = node.openingElement.attributes;
  var index = findAttributeIndex(attribute, attributes);
  if (index < 0) return;

  var value = attributes[index].value;
  if (attributes[index].value.type !== "Literal") return;

  value = value.value;
  if (shouldSpliceFn && shouldSpliceFn(value)) {
    attributes.splice(index, 1);
  }
  return value;
};

var findTranslateAttribute = findAttribute.bind(null, "translate");
var findKeyAttribute = findAttribute.bind(null, "key");


function transformationsFor(config) {
  config = config || {};
  config.autoTranslateTags = config.autoTranslateTags || [];
  config.neverTranslateTags = config.neverTranslateTags || [];

  var isTranslating = false;

  var setIsTranslating = function(newValue, fn) {
    var prevValue = isTranslating;
    isTranslating = newValue;
    fn();
    isTranslating = prevValue;
  };

  var PLACEHOLDER_PATTERN = /(%\{.*?\})/;

  var interpolatorName = "I18n.ComponentInterpolator";

  var isTranslatable = function(node, parentIsTranslatable) {
    var alwaysSpliceTranslateAttr = (typeof parentIsTranslatable === "undefined");
    var shouldSpliceTranslateAttr = function(value) {
      return alwaysSpliceTranslateAttr || value === "yes";
    };

    if (parentIsTranslatable !== true)
      parentIsTranslatable = false;

    var tagName = node.openingElement && node.openingElement.name.name;
    var translateAttr = findTranslateAttribute(node, shouldSpliceTranslateAttr);
    if (translateAttr) {
      return translateAttr === "yes";
    } else if (tagName && config.autoTranslateTags.indexOf(tagName) >= 0) {
      return true;
    } else if (tagName && config.neverTranslateTags.indexOf(tagName) >= 0) {
      return false;
    } else {
      return parentIsTranslatable;
    }
  };

  var componentInterpolatorFor = function(string, wrappers, placeholders, children, loc) {
    var properties = [];
    var key;
    properties.push(
      b.jsxAttribute(
        b.jsxIdentifier("string"),
        b.jsxExpressionContainer(translateCallFor(loc, string))
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

    return b.jsxElement(
      b.jsxOpeningElement(
        b.jsxIdentifier(interpolatorName),
        properties
      ),
      b.jsxClosingElement(
        b.jsxIdentifier(interpolatorName)
      ),
      children.map(function(child) {
        return typeof child === "string" ? b.literal(child) : child;
      })
    );
  };

  var translateCallFor = function(loc, string) {
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

    var receiver = b.identifier("I18n");
    receiver.loc = loc;
    return b.callExpression(
      b.memberExpression(
        receiver,
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
    var newChildren = [];
    var string = translateStringFor(innerNode, wrappers, placeholders, newChildren);
    innerNode.children = newChildren;

    return " " + delimiter + string + delimiter + " ";
  };

  var findInnerNodeFor = function(node) {
    var nodesWithText = node.children.filter(hasLiteralContent);
    if (nodesWithText.length === 1 && nodesWithText[0].type === "JSXElement")
      return nodesWithText[0];
    else
      return node;
  };

  var placeholderBaseFor = function(node) {
    if (node.type === "JSXExpressionContainer")
      node = node.expression;

    var baseString;
    if (node.type === "JSXElement")
      baseString = findKeyAttribute(node);

    if (!baseString) {
      var source = recast.print(node).code;
      baseString = source.replace(/<\/[^>]+>/g, '')
                         .replace(/this\.((state|props)\.)/g, '');

      if (hasNonJSXDescendants(node)) {
        baseString = baseString.replace(/<\w+[^>]*>/, '');
      }
    }

    return baseString.replace(/([A-Z]+)?([A-Z])/g, '$1 $2')
                     .toLowerCase()
                     .replace(/[^a-z0-9]/g, ' ')
                     .trim()
                     .replace(/\s+/g, '_');
  };

  var placeholderStringFor = function(node, placeholders) {
    var placeholderBase = placeholderBaseFor(node);
    var placeholder = placeholderBase;
    var i = 0;
    while (placeholders[placeholder]) {
      placeholder = placeholderBase + (++i);
    }
    placeholders[placeholder] = node;
    return "%{" + placeholder + "}";
  };

  var translateStringFor = function(node, wrappers, placeholders, newChildren) {
    var string = "";
    var standalones = newChildren;
    node.children.forEach(function(child) {
      var part;
      var translatable = isTranslatable(child, true);
      if (child.type === "Literal") {
        part = child.value;
      } else if (hasLiteralContent(child) && translatable) {
        part = wrappedStringFor(child, wrappers, placeholders);
      } else if (findNestedJSXExpressions(child).length === 1 || !translatable || findKeyAttribute(child)) {
        part = placeholderStringFor(child, placeholders);
      } else {
        standalones.push(child);
        return;
      }

      // unless they are leading, flush any standalone tags to the string
      // as placeholders; leading ones just go in newChildren
      if (string) {
        standalones.forEach(function(child) {
          string += placeholderStringFor(child, placeholders);
        });
      }
      standalones = [];
      string += part;
    });
    // make sure "$1" is present in newChildren, followed by any trailing
    // standalone tags
    standalones.unshift("$1");
    newChildren.push.apply(newChildren, standalones);
    return string;
  };

  var translateExpressionFor = function(node) {
    var wrappers = {};
    var placeholders = {};
    var children = [];
    var string = translateStringFor(node, wrappers, placeholders, children)
                  .replace(/\s+/g, ' ')
                  .trim();
    if (Object.keys(wrappers).length || Object.keys(placeholders).length || children.length > 1) {
      return componentInterpolatorFor(string, wrappers, placeholders, children, node.loc);
    } else {
      return b.jsxExpressionContainer(translateCallFor(node.loc, string, wrappers, placeholders));
    }
  };

  return {
    visitJSXElement: function(path) {
      var node = path.value;
      var shouldTranslate = isTranslatable(node) && !isTranslating;
      setIsTranslating(shouldTranslate || isTranslating, function() {
        if (shouldTranslate) {
          node.children = [translateExpressionFor(node)];
        }
        this.traverse(path);
      }.bind(this));
    },

    visitJSXExpressionContainer: function(path) {
      setIsTranslating(false, function() {
        this.traverse(path);
      }.bind(this));
    },

    visitJSXAttribute: function(path) {
      if (isTranslating && isTranslatableAttribute(path.parentPath.parentPath.value, path.value)) {
        path.value.value =  b.jsxExpressionContainer(translateCallFor(path.value.loc, path.value.value.value));
      }
      this.traverse(path);
    }
  };
}

var preprocess = function(source, config) {
  config = config || {};
  var ast = recast.parse(source, config.recastOptions);
  preprocessAst(ast, config);
  return recast.print(ast).code;
};

var preprocessAst = function(ast, config) {
  recast.visit(ast, transformationsFor(config));
  return ast;
};

preprocess.ast = preprocessAst;

module.exports = preprocess;
