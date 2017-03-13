var React = require('react');
var DateRangePicker = require('react-bootstrap-daterangepicker');
var moment = require('moment');

var FormMixin = require('./form');

var EditEventForm = React.createClass({
  mixins: [FormMixin],

  getInitialState: function() {
    var initialData = this.props.event_data;
    if(initialData.date_time_start && initialData.date_time_end){
      initialData['daterange'] = moment(initialData.date_time_start).format('MMM DD, YYYY hh:mm A') + ' - ' + moment(initialData.date_time_end).format('MMM DD, YYYY hh:mm A');
    }else{
      initialData['daterange'] = "Date has not been set";
    }

    return {
      data: initialData,
      base_url: window.location.origin,
      remember: true,
      btn_disabled: false
    }
  },

  handleResponse: function(results){
    if (results.success) {
      window.location.href = '/admin?event_edited=true';
    } else {
      if(results.error) {
        this.showErrorNotification(results);
      }
    }
  },

  handleClick: function(event) {
    event.preventDefault();
    var _this = this;
    var _base = this.state.base_url + '/';
    var params = _this.state.data;
    _this.setState({btn_disabled : true});

    this.ajaxHandler.postRequest(
      '/admin/update_event',
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

module.exports = EditEventForm;