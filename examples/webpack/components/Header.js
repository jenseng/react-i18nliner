var I18n = require("i18n-js");
var React = require("react");

module.exports = React.createClass({
  updateLocale: function(e) {
    var target = e.target;
    this.props.updateLocale(e.target.value);
  },

  render: function() {
    return (
      <div className="Header">
        <h1 translate="yes">
          This is so great
        </h1>

        <div className="Header__controls">
          {/*
            Note that we do translate the label with a placeholder for the
            <select>, but we don't translate the options */}
          <label translate="yes">
            Language: <select
              translate="no"
              value={this.props.selectedLocale}
              onChange={this.updateLocale}
              key="language"
            >
             <option value="en-US">English (US)</option>,
             <option value="es-MX">Español (México)</option>,
             <option value="fr-FR">Français (France)</option>,
             <option value="pt-BR">Português (Brasil)</option>,
             <option value="ja-JP">Japanese (日本語)</option>

            </select>
          </label>

          <img
            src={"assets/" + this.props.selectedLocale + ".svg"}
            style={{width: 20, height: 15, verticalAlign: "middle", marginLeft: 5}}
          />
        </div>
      </div>
    );
  }
});
