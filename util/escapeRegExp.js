module.exports = function(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
};
