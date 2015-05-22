var I18n = require("i18n-js");
var React = require("react");

module.exports = React.createClass({
  linkClicked: function(e) {
    e.preventDefault();
    alert("Yay react still works inside translated components \\o/");
  },

  render: function() {
    return (
      <div className="Content">
        <p translate="yes">
          Create <input key="num" size="5" /> groups
        </p>

        <p translate="yes">
          <a href="#" onClick={this.linkClicked}>Click here</a> to get started
        </p>
      </div>
    );
  }
});

