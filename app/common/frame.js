/** @jsx React.DOM */
var React = require('react');

var Frame = React.createClass({
  render: function () {
    return (
      <iframe />
    );
  },

  componentDidMount: function () {
    this.renderFrameContents();
  },

  renderFrameContents: function () {
    var doc = this.getDOMNode().contentWindow.document;

    if (doc.readyState === 'complete') {
      React.render(this.props.head, doc.head);
      React.render(this.props.children, doc.body);
    } else {
      setTimeout(this.renderFrameContents, 0);
    }
  },

  componentDidUpdate: function () {
    this.renderFrameContents();
  },

  componentWillUnmount: function () {
    React.unmountComponentAtNode(this.getDOMNode().contentWindow.document.body);
  }
});


module.exports = Frame;