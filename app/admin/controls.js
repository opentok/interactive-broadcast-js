/** @jsx React.DOM */
var React = require("react");
var ReactZeroClipboard = require('react-zeroclipboard');

var AdminControls = React.createClass({

    render: function () {
        var _this = this;
        var embeds = ['fan', 'host', 'celebrity'];

      var listEmbeds = embeds.map(function (embedType) {

          var embedText = 'Get ' + embedType + ' code';

          var btn = React.createElement(
            ReactZeroClipboard, {
              text: _this.props.embedCode(embedType),
              onAfterCopy: _this.props.copiedToClipboard,
              key: 'embed_' + embedType
            },
            <button key={"button_embed_" + embedType}>{embedText}</button>
          );
          return (<li key={"li_embed_" + embedType}>{btn}</li>);
        });

      var copy_admin = React.createElement(
        ReactZeroClipboard, {
          text: _this.props.adminId,
          onAfterCopy: _this.props.copiedToClipboard,
          key: 'admin_hash'
        },
        <button key="admin_hash" className="btn btn-light actions">Copy AdminID</button>
      );
        return (
          <div className="btn-group">
             <button className="btn btn-light btn-embed dropdown-toggle " type="button" id="dropdownMenu1" data-toggle="dropdown" aria-expanded="false">
              Get Embed Code
              <span className="caret"></span>
            </button>
            <ul className="dropdown-menu dropdown-embed" role="menu" aria-labelledby="dropdownMenu1">
              {listEmbeds}
            </ul>

              {copy_admin}

            <a id="new-event" href="/admin/events/new" className="btn btn-light actions">
              <i className="fa fa-plus-circle"></i>
              Add New Event
            </a>
            <a href="/admin/users" className={this.props.isSuper ? "btn btn-light actions" : "hidden"}>
                <i className="fa fa-plus-circle"></i>
                  Manage Users
                </a>

          </div>
        );
    }
});

module.exports = AdminControls;
