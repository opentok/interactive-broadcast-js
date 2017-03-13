/** @jsx React.DOM */
var React = require('react');

var AjaxHandler = require('./../common/ajax-handler');
var DateTimeUtils = require('./../common/datetime-utils');

var EventList = React.createClass({
    ajaxHandler: new AjaxHandler(),
    dateTimeUtils: new DateTimeUtils(),
    getInitialState: function() {
      return {
        event: this.props.info,
        ajaxresults: null,
        deleted: false
      };
    },
    startEvent: function (event) {
      this.change_event_status('P');
    },

    viewPage: function (event) {
      window.location = '/admin/events/' + this.state.event.id;
    },

    editPage: function (event) {
      window.location = '/admin/events/' + this.state.event.id + '/edit';
    },

    downloadEndedEvent: function (event) {
      window.location = '/admin/events/' + this.state.event.id + '/download';
    },

    viewEndedEvent: function (event) {
        window.location = '/admin/events/' + this.state.event.id + '/view';
    },
    viewEventMetrics: function (event) {
        window.location = '/admin/metrics/' + this.state.event.id ;
    },
    deleteEvent: function (event) {
        var _this = this;
        swal({   title: "Are you sure you want to delete this event?",
                text: "You will permanently delete this event.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Delete Event",
                cancelButtonText: "Cancel",
                closeOnConfirm: true,
                closeOnCancel: true },
            function(isConfirm){
                if (isConfirm) {
                    var change = _this.state;
                    change.deleted = true;
                    _this.setState(change);
                    _this.props.onEventDelete(_this.state.event.id);
                }
            });
    },

    closeEvent: function (event){
        var _this = this;
        swal({   title: "Are you sure you want to close this event?",
            text: "This will permanently close the event, any fans in the show will be notified.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Close Event",
            cancelButtonText: "Cancel",
            closeOnConfirm: true,
            closeOnCancel: true },
            function(isConfirm){
                if (isConfirm) {
                    _this.handleCloseEvent();

                }
            });

    },

    sendFinishEventSignal: function() {
      var _ajaxresults = this.state.ajaxresults;
      this.onstageSession = this.props.OT.initSession(_ajaxresults.apiKey, _ajaxresults.sessionIdHost);
      this.onstageSession.connect(_ajaxresults.tokenHost, this.onStageSessionConnected);
    },

    onStageSessionConnected: function (error) {
      if(!error) {
        var disconnectSignal = { type: 'finishEvent' };
        this.onstageSession.signal(disconnectSignal, this.onSendFinishEventSignalCompleted);
      } else {
        console.log(error);
      }
    },

    onSendFinishEventSignalCompleted: function (){
     if(this.onstageSession) {
       this.onstageSession.off();
       this.onstageSession.disconnect();
     }
    },

    stopRecording: function() {
      var _event = this.state.ajaxresults.event;
      var _this = this;
      if (_event.archive_id) {
        var stopArchiveUrl = ['/admin/archive/stop/', _event.archive_id].join('');
        $.get(stopArchiveUrl, function (result) {
          console.log('ARCHIVING STOPPED');
          console.log(result);
        });
      }
    },

    handleCloseEvent: function() {
      var _event = this.state.event;
      this.ajaxHandler = new AjaxHandler();
      this.ajaxHandler.getRequest(
          ['/admin/create_service/', _event.id].join(''),
          this.onSessionDataReceived,
          this.onAjaxRequestError
      );
    },


    onSessionDataReceived: function(results) {
        var results = JSON.parse(results);
        if (this.isMounted()) {
            this.setState({ ajaxresults: results });
            console.log('results', this.state.ajaxresults);
            this.sendFinishEventSignal();
            this.stopRecording();
            this.change_event_status('C');
        }
    },

    change_event_status: function (sNewStatus) {
      var _this = this;
      this.props.onEventChangeStatus(this.state.event, sNewStatus)
      .then(function(bSuccess){
        if(bSuccess){
          var change = _this.state.event;
          change["status"] = sNewStatus;
          _this.setState(change);
        }
      });
    },

    onAjaxRequestError: function(error) {
        console.log('onAjaxRequestError:error', error);
    },

    render: function() {
      var currentEvent = this.state.event;
      var txtStatus = '';
      var txtEventName = '';
      var eventButtons = '';
      var txtEventDate = 'Date Not Provided';

      if (currentEvent.date_time_start && currentEvent.date_time_end) {
        txtEventDate = this.dateTimeUtils.formatDate(currentEvent.date_time_start) + ' to ' + this.dateTimeUtils.formatDate(currentEvent.date_time_end);
      }

      switch(currentEvent.status) {
        case 'N':
            txtStatus = <span className="event-status created">Created</span>;
            eventButtons =  <div className="event-actions">
              <a href="javascript:;" onClick={this.startEvent.bind(this, 'status')} className="btn btn-success actions">
                <i className="fa fa-check-circle-o"></i>
                Start Event
              </a>
              <a href="javascript:;" onClick={this.editPage} className="btn btn-warning actions">
                <i className="fa fa-pencil-square-o"></i>
                Edit
              </a>
              <a href="javascript:;" onClick={this.deleteEvent} className="btn btn-danger actions">
                <i className="fa fa-times-trash-o"></i>
                Delete
              </a>
            </div>
          break;
        case 'P':
          txtStatus = <span className="event-status pre-show">Event Preshow</span>;
          eventButtons =  <div className="event-actions">
              <a href="javascript:;" onClick={this.viewPage.bind(this, 'id')} className="btn btn-success actions">
                <i className="fa fa-eye"></i>
                View Event
              </a>
              <a href="javascript:;" onClick={this.closeEvent.bind(this, 'status')} className="btn btn-basic actions">
                <i className="fa fa-times-circle-o"></i>
                Close Event
              </a>
            </div>
          break;
        case 'L':
          txtStatus = <span className="event-status live">Live</span>;
          eventButtons = <div className="event-actions">
              <a href="javascript:;" onClick={this.viewPage.bind(this, 'id')} className="btn btn-info actions">
                <i className="fa fa-eye"></i>
                View Event
              </a>
              <a href="javascript:;" onClick={this.closeEvent.bind(this, 'status')} className="btn btn-basic actions">
                <i className="fa fa-times-circle-o"></i>
                End Event
              </a>
            </div>
          break;
        case 'C':
          var duration,txtDuration = '';
          txtStatus = <span className="event-status closed">Closed</span>;
          if(currentEvent.show_ended && currentEvent.show_started) {
            currentEvent.show_ended = currentEvent.show_ended.substring(0, 19);
            currentEvent.show_started = currentEvent.show_started.substring(0, 19);
            duration = moment.utc(moment(currentEvent.show_ended).diff(moment(currentEvent.show_started))).format('HH:mm:ss');      
          } else {
            duration = '00:00:00';
          }
          txtDuration = <span className="event-date"> <i className="fa fa-clock-o"></i> Total time consumed: {duration}</span>
          var metricsBtn = null;
          if(currentEvent.has_metrics){
              metricsBtn = <a href="javascript:;" onClick={this.viewEventMetrics} className="btn btn-warning actions">
                  <i className="fa fa-eye"></i> View Metrics
              </a>;
          }

          if (currentEvent.archive_id) {
              if (currentEvent.hasvideo) {
                  if(currentEvent.composed){
                      eventButtons = <div className="event-actions">
                          {metricsBtn}
                          <a href="javascript:;" onClick={this.viewEndedEvent} className="btn btn-info actions">
                              <i className="fa fa-eye"></i> View Event
                          </a>
                      </div>
                  }else{
                      eventButtons = <div className="event-actions">
                          {metricsBtn}
                          <a href="javascript:;" onClick={this.downloadEndedEvent} className="btn btn-info actions">
                              <i className="fa fa-cloud-download"></i> Download Event
                          </a>
                      </div>
                  }

              } else {
                eventButtons = <div className="event-actions">
                    {metricsBtn}
                    <a href="javascript:;" className="btn btn-basic actions">
                      <i className="fa fa-ban"></i> No Video Recorded
                    </a>
                </div>
              }
            }
          //}
          break;
      }

      if (currentEvent.status == 'N') {
        txtEventName = <span className="event-title"><a href="javascript:;" onClick={this.editPage.bind(this, 'id')}>{currentEvent.event_name}</a></span>;
      } else {
        txtEventName = <span className="event-title">{currentEvent.event_name}</span>;
      }

      return (
          <div className="event-line">
            {txtEventName}
            <span className="event-date">{txtEventDate}</span>
            {txtDuration}
            {txtStatus}
            {eventButtons}
          </div>
      );
    }
});

module.exports = EventList;
