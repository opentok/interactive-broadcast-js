var React = require('react');
var DateRangePicker = require('react-bootstrap-daterangepicker');

var FormMixin = require('./form');

var AddEventForm = React.createClass({
  mixins: [FormMixin],

  getInitialState: function() {
    return {
      data: {
        admins_id: this.props.admins_id,
        status: 'N',
        event_name: '',
        date_time_start:null,
        date_time_end:null,
        archive_event: this.props.elem.getAttribute("instance_enable_archiving") === 'true' ? true : false,
        fan_url: '',
        host_url: '',
        celebrity_url: '',
        redirect_url: '',
        daterange : "Date has not been set",
        composed: false
      },
      base_url: window.location.origin,
      remember: true,
      btn_disabled: true
    }
  },

  handleResponse: function(results){
    var _this = this;
    if (results.id) {
      window.location.href = '/admin?event_added=true';
    } else {
      if(!results.success) {
        _this.showErrorNotification(results);
      }
    }
  },

  handleClick: function(event) {
    event.preventDefault();
    this.setState({btn_disabled : true});
    var _this = this;
    var _base = this.state.base_url + '/';
    var params = _this.state.data;

    this.ajaxHandler.postRequest(
      '/admin/create_event',
      params,
      function(data) {
        data = typeof(data) === 'string' ? JSON.parse(data) : data;
        _this.handleResponse(data);
        _this.setState({btn_disabled : false});
      }, function(err) {
          _this.setState({btn_disabled : false});
          console.log(err);
      }
    );
  }
});


module.exports = AddEventForm;
