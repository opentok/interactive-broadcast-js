/** @jsx React.DOM */
var React = require('react');
var Frame = require('./../common/frame');

var EmbedableWidget = React.createClass({

  loadOpenTokSession: function () {
    var contentWindow = this.getDOMNode().contentWindow;
    var doc = contentWindow.document;
    var data = contentWindow.parent.window.chatShowData;
    var onstageSession = OT.initSession(data.sessionIdHost);
    var _this = this;

    console.log('INFO: ', data);

    if(data.event_status == 'L') {
      console.log('connecting to onstage, we are live');
      this.connectOnstage();
    }

    onstageSession.connect(data.apiKey, data.tokenHost, function (err, info) {
      if (err)
        alert(err.message || err);
    });

    onstageSession.on('signal:goLive', function (event) {
      console.log('going live!');
      _this.connectOnstage();
    });
  },

  connectOnstage: function(){
    console.log('connecting to onstage');
    var contentWindow = this.getDOMNode().contentWindow;
    var data = contentWindow.parent.window.chatShowData;
    var session = OT.initSession(data.sessionId);
    var doc = contentWindow.document;

    session.connect(data.apiKey, data.token, function (err, info) {
      if (err)
        alert(err.message || err);
    });

    session.on('streamCreated', function (event) {
      session.subscribe(event.stream, doc.querySelector('#subscribers'), {
        insertMode: 'append'
      });
      console.log('Subcscribed to stream ', event.stream);
    });
  },

  componentDidMount: function() {
    this.loadOpenTokSession();
  },

  render: function() {
    return (
      <Frame head={
        <link type='text/css' href='styles.css' />
      }>
        <div id='subscribers'></div>
      </Frame>
    );
  }
});

React.render(
  <EmbedableWidget name='Embedable' />,
  document.querySelector('#' + window.chatShowData.container)
);