'use strict';

var React = require('react');
var invariant = require('invariant');

var _require = require('prop-types'),
    string = _require.string,
    object = _require.object;

var WRAPPER_PATTERN = /(\*+)/;
var PLACEHOLDER_PATTERN = /(%\{.*?\})/;

var toArray = function toArray(children) {
  if (children instanceof Array) return children.slice();
  if (!children) return [];
  return [children];
};

// Replace a "$1" text descendant in this tree with the newDescendants
var injectNewDescendants = function injectNewDescendants(element, newDescendants, props, ensureInjected) {
  newDescendants.injectedCount = newDescendants.injectedCount || 0;
  props = props || {};

  var children = toArray(element.props.children);
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    children[i] = child.type ? injectNewDescendants(child, newDescendants) : child;
  }

  var injectIndex = getInjectIndex(children);
  if (injectIndex >= 0) {
    children.splice.apply(children, [injectIndex, 1].concat(newDescendants));
    newDescendants.injectedCount++;
  }

  props.children = children.length ? children : null;
  if (ensureInjected) {
    invariant(newDescendants.injectedCount === 1, 'wrappers must have a single "$1" text descendant');
  }
  return React.cloneElement(element, props);
};

var getInjectIndex = function getInjectIndex(children, containerName) {
  var child,
      index = -1;
  for (var i = 0; i < children.length; i++) {
    child = children[i];
    if (typeof child !== "string") continue;
    invariant(child === "$1", containerName + ' may not have any non-"$1" text children"');
    invariant(index === -1, containerName + ' may not have multiple "$1" text children"');
    index = i;
  }
  return index;
};

var Counter = function Counter() {
  this.count = 0;
  this.next = function () {
    return this.count++;
  };
};

var inferChildren = function inferChildren(props) {
  var tokens = (props.string || '').split(WRAPPER_PATTERN);
  var inferredChildren = interpolateAllComponents(tokens, props);

  var currentChildren = toArray(props.children);

  var index = getInjectIndex(currentChildren, '<ComponentInterpolator>');
  invariant(index >= 0, '<ComponentInterpolator> must have a "$1" text child"');
  currentChildren.splice.apply(currentChildren, [index, 1].concat(inferredChildren));
  return currentChildren;
};

var interpolateAllComponents = function interpolateAllComponents(tokens, props, keyCounter, eof) {
  var token, child;
  var children = [];
  var wrappers = props.wrappers || {};
  if (!keyCounter) {
    keyCounter = new Counter();
  }
  while (tokens.length) {
    token = tokens.shift();
    if (token === eof) break;
    if (token.match(WRAPPER_PATTERN)) {
      invariant(child = wrappers[token], '<ComponentInterpolator> expected \'' + token + '\' wrapper, none found');

      child = injectNewDescendants(child, interpolateAllComponents(tokens, props, keyCounter, token), { key: keyCounter.next() }, true);
      children.push(child);
    } else {
      children.push.apply(children, interpolatePlaceholders(token, props, keyCounter));
    }
  }
  return children;
};

var interpolatePlaceholders = function interpolatePlaceholders(string, props, keyCounter) {
  var token, child;
  var tokens = string.split(PLACEHOLDER_PATTERN);
  var children = [];
  while (tokens.length) {
    token = tokens.shift();
    if (token.match(PLACEHOLDER_PATTERN)) {
      token = token.slice(2, -1);
      invariant(props.hasOwnProperty(token), '<ComponentInterpolator> expected \'' + token + '\' placeholder value, none found');
      child = props[token];
      child = child && child.type ? React.cloneElement(child, { key: keyCounter.next() }) : child;
      children.push(child);
    } else {
      children.push(token);
    }
  }
  return children;
};

var ComponentInterpolator = function ComponentInterpolator(props) {
  return React.createElement('span', {}, inferChildren(props));
};

ComponentInterpolator.propTypes = {
  string: string.isRequired,
  wrappers: object
};

module.exports = ComponentInterpolator;