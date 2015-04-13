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
  "title":       function() { return true },
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
  var value;
  if (index >= 0) {
    value = attributes[index].value.value;
    if (shouldSpliceFn && shouldSpliceFn(value)) {
      attributes.splice(index, 1);
    }
  }
  return value;
};

var extractTranslateAttribute = findAttribute.bind(null, "translate");


function transformationsFor(i18nliner) {
  i18nliner = i18nliner || {};
  i18nliner.autoTranslateTags = i18nliner.autoTranslateTags || [];
  i18nliner.neverTranslateTags = i18nliner.neverTranslateTags || [];

  var isTranslating = false;

  var setIsTranslating = function(newValue, fn) {
    prevValue = isTranslating;
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
    var translateAttr = extractTranslateAttribute(node, shouldSpliceTranslateAttr);
    if (translateAttr) {
      return translateAttr === "yes"
    } else if (tagName && i18nliner.autoTranslateTags.indexOf(tagName) >= 0) {
      return true;
    } else if (tagName && i18nliner.neverTranslateTags.indexOf(tagName) >= 0) {
      return false;
    } else {
      return parentIsTranslatable;
    }
  };

  var componentInterpolatorFor = function(string, wrappers, placeholders, children) {
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
    var source = recast.print(node).code;
    var baseString = source.replace(/<\/[^>]+>/g, '')
                           .replace(/([A-Z]+)?([A-Z])/g, '$1 $2')
                           .replace(/this\.((state|props)\.)/g, '');

    if (hasNonJSXDescendants(node)) {
      baseString = baseString.replace(/<\w+[^>]*>/, '');
    }

    return baseString.toLowerCase()
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
      } else if (findNestedJSXExpressions(child).length === 1 || !translatable) {
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
                  .replace(/ +/g, ' ')
                  .trim();
    var expression;
    if (Object.keys(wrappers).length || Object.keys(placeholders).length || children.length > 1) {
      return componentInterpolatorFor(string, wrappers, placeholders, children);
    } else {
      return b.jsxExpressionContainer(translateCallFor(string, wrappers, placeholders));
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
      }.bind(this))
    },

    visitJSXAttribute: function(path) {
      if (isTranslating && isTranslatableAttribute(path.parentPath.parentPath.value, path.value)) {
        path.value.value =  b.jsxExpressionContainer(translateCallFor(path.value.value.value));
      }
      this.traverse(path);
    }
  };
}

module.exports = function(source, i18nliner) {
  var ast = recast.parse(source);
  recast.visit(ast, transformationsFor(i18nliner));
  return recast.print(ast).code;
};
