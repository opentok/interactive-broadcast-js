/** @jsx React.DOM */
var React        = require('react');

var initApp = function(scope) {
    var requiredFeatures = {
        'the selectors API': document.querySelector,
        'ES5 array methods': Array.prototype.forEach,
        'DOM level 2 events': window.addEventListener,
        'the HTML5 history API': window.history.pushState
    };
    var dependencies = { OT: window.OT };

    for (var feature in requiredFeatures) {
        if (!requiredFeatures[feature]) {
            return alert(['Sorry, but your browser does not support', feature, "so this app won't work properly."].join(' '));
        }
    }
    if (document.getElementById('login_container')) {
      var LoginForm    = require('./admin/login');
      return React.render(React.createElement(LoginForm), document.getElementById('login_container'));
    }

    if (document.getElementById('set_password_container')) {
      var SetPasswordForm = require('./admin/set_password_form.js');
      return React.render(React.createElement(SetPasswordForm), document.getElementById('set_password_container'));
    }

    if (document.getElementById('fanApp')) {
      var FanApp       = require('./fan/main');
      var _            = require('underscore');

      var client = new ClientJS();
      var userData = {
            "user_id":client.getFingerprint(),
            "os":client.getOS(),
            "is_mobile": client.isMobile(),
            "browser" : client.getBrowser()
        }
      return React.render(React.createElement(
          FanApp, _.defaults(dependencies, {
              elem: document.getElementById('fanApp'),
              streamUIOptions: window.streamOptions,
              fingerprint_data:userData
          })
      ), document.getElementById('fanApp'));
    }
    if (document.getElementById('show_container')) {
      var ShowContainer = require('./events/show');
      var _            = require('underscore');
      return React.render(React.createElement(
          ShowContainer, _.defaults(dependencies, {
              elem: document.getElementById('show_container'),
              streamUIOptions: window.streamOptions
          })
      ), document.getElementById('show_container'));
    }

    if (document.getElementById('view_event_container')) {
      var ViewEvent = require('./events/viewEvent');
      return React.render(
          React.createElement(ViewEvent, {eventData: $("#view_event_container").data("event-data")}),
          document.getElementById('view_event_container')
      );
    }

    if (document.getElementById('celebrity_host_app_container')) {
      var CelebrityHostApp = require('./celebrity_host/main');
      return React.render(
        React.createElement(
          CelebrityHostApp,
          {elem: document.getElementById('celebrity_host_app_container')}
        ),
        document.getElementById('celebrity_host_app_container')
      );
    }

    if (document.getElementById('add_event_container')) {
      var AddEventForm = require('./events/add_event_form');
      return React.render(
        React.createElement(
          AddEventForm,
          {admins_id: $("#add_event_container").attr("admins_id"),
              elem: document.getElementById('add_event_container')
          }
        ),
        document.getElementById('add_event_container')
      );
    }

    if (document.getElementById('edit_event_container')) {
      var EditEventForm = require('./events/edit_event_form');
      return React.render(React.createElement(
        EditEventForm, {
          admins_id: $("#edit_event_container").attr("admins_id"),
          event_data: $("#edit_event_container").data("event-data"),
          elem: document.getElementById('edit_event_container')
        }),
        document.getElementById('edit_event_container')
      );
    }

    if (document.getElementById('event_list_container')) {
      var EventList    = require('./events/list');
      var _            = require('underscore');
      return React.render(
          React.createElement(
              EventList,
              _.defaults(dependencies, {
                  elem: document.getElementById('event_list_container'),
                  adminElem: document.getElementById('admin-controls')
              })
          ),
          document.getElementById('event_list_container')
      );
    }

    if (document.getElementById('broadcast_app')) {

      var BroadcastApp = require('./broadcast/main');

      return React.render(
          React.createElement(BroadcastApp),
          document.getElementById('broadcast_app')
      );
    }

  if (document.getElementById('user_list_container')) {
    var UserList    = require('./users/list');
    var _            = require('underscore');
    return React.render(
      React.createElement(
        UserList,
        _.defaults(dependencies, {
          elem: document.getElementById('user_list_container'),
          adminElem: document.getElementById('admin-controls')
        })
      ),
      document.getElementById('user_list_container')
    );
  }

};

var bootstrap = function() {
  if (typeof(window.OT) !== 'undefined') window.app = initApp();
  else {
    setTimeout(bootstrap, 200);
  }
};

bootstrap();
