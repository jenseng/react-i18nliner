var I18n = require("i18n-js");

var React = require("react");
var Header = require("./components/Header");
var Content = require("./components/Content");

var App = React.createClass({
  changeLocale: function(newLocale) {
    I18n.locale = newLocale;
    this.forceUpdate();
  },

  render: function() {
    return (
      <div>
        <Header
          updateLocale={this.changeLocale}
          selectedLocale={I18n.locale}
        />
        <Content />
      </div>
    );
  }
});

React.render(<App />, document.body);
