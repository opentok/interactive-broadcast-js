/** @jsx React.DOM */
var React = require("react");
var _ = require("underscore");
var moment = require("moment");
var ReactToastr = require('react-toastr');
var ToastContainer = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

var EventListItem = require("./listItem");
var AjaxHandler = require("./../common/ajax-handler");
var AdminControls = require('./../admin/controls');

var EventList = React.createClass({
    ajaxHandler: new AjaxHandler(),
    getInitialState: function() {
        return {
            events:[],
            loadingEvents : true,
            notification : {type:null,
                            message:null},
            sorts: {
              recent: 'DESC',
              start: null,
              state: null
            }
        };
    },

    copiedToClipboard: function (e) {
      this.refs.toastContainer.success(
        'Code successfully copied to clipboard',
        'Success', {
          tapToDismiss: true,
          closeButton: true,
          showAnimation: 'animated fadeInDown',
          hideAnimation: 'animated fadeOutUp',
          clearAlert: function () {
            this.refs.container.clear();
          }
        }
      );
    },

    setNotification: function(type,message){
      var t = type == "success"? "alert3" : "alert6";
      var notification = {type: t,message:message};
      this.setState({notification:notification});
      $("#alerttopright").fadeIn(350);
      setTimeout(function(){
        $("#alerttopright").fadeOut(350);
      },5000);
    },

    startWebsocketConnection: function() {
      var _this = this;
      this.io = window.io;
      this.socket = this.io.connect(this.props.adminElem.getAttribute('data-signaling-server-url'));
      this.socket.on ('changeStatusSuccess', function (data) {
        if (data.newStatus === 'P' && _this.joinToPreshow === data.id) window.location = '/admin/events/' + data.id;
      });
    },

    eventChangeStatus: function(event, sNewStatus) {
      var _this = this;

      return new Promise(function(resolve, reject) {
        var nIdEvent = event.id;
        var message;
        switch(sNewStatus) {
          case 'P':
            message = 'Your event is now in Preshow';
            break;
          case 'C':
            message = 'Your event is now Closed';
            break;
          case 'L':
            message = 'Your event is now Live';
            break;
          default:
            message = 'Your event was successfully changed';
            break;
        }

        $.post(
          "/admin/change-event-status",
          {id: nIdEvent, newStatus: sNewStatus },
          function(result) {
            if(result.error){
              _this.setNotification("error",result.error);
              resolve(false);
            }else{
              _this.joinToPreshow = nIdEvent;
              var data = {'id': nIdEvent,
                'newStatus': sNewStatus,
                'sessionId':event.stage_sessionid};
              _this.socket.emit('changeStatus', data);
              _this.setNotification("success",message);
              _this.setState({
                events: _this.state.events
              });
              resolve(true);
            }
          }
        );
      });
    },

    currentEvents: function(events) {
      return events.filter(function(event) {
        return event.status != 'C';
      });
    },

    eventDelete: function(nIdEvent) {
      var _this = this;
      var oldEvents = this.state.events;
      var newEvents = oldEvents.filter(function (event) {
        return parseInt(event.id) != parseInt(nIdEvent);
      });

      $.post("/admin/event-delete", {id: nIdEvent},function(data){
        if(data["success"]){
          _this.setState({
            events: newEvents,
            loadingEvents:false
          });
          _this.setNotification("success","Event successfully Deleted!");

        }
      });
    },

    refreshListFromServer: function() {
      $.get("/admin/get-my-events", function(result) {
        var results = typeof(result) === "string" ? JSON.parse(result) : result;
        if (this.isMounted()) {
          this.setState({
            events: _.sortBy(results,function(e){ return moment(e.date_time_start)}),
            loadingEvents : false
          });
        }
      }.bind(this));
    },

    componentDidMount: function() {
      var windowHash = window.location.hash;

      if(this.props.elem.getAttribute("notification")){
        this.setNotification("success",this.props.elem.getAttribute("notification"));
      }
      this.refreshListFromServer();
      if(windowHash) {
        $("li[role=presentation] a[href='"+windowHash+"']").click();
      }

      this.startWebsocketConnection();
    },

    componentWillUnmount: function() {
      this.socket && this.socket.disconnect();
    },

    componentDidUpdate: function () {
      var adminControls = React.render(
        React.createElement(AdminControls, {
          copiedToClipboard: this.copiedToClipboard,
          embedCode: this.getEmbedCode,
          isSuper:JSON.parse(this.props.elem.getAttribute("isSuper")),
          adminId:this.props.adminElem.getAttribute('data-admin-id')
        }), this.props.adminElem
      );
    },

    toggleSortByStartDate: function() {
      var current = this.state.sorts.start;
      var newVal;

      if (!current) newVal = 'DESC';
      else newVal = current === 'ASC' ? 'DESC' : 'ASC';

      this.setState({ sorts: { start: newVal, recent: null, state: null } });
    },

    toggleSortByRecent: function() {
      var current = this.state.sorts.recent;
      var newVal;

      if (!current) newVal = 'DESC';
      else newVal = current === 'ASC' ? 'DESC' : 'ASC';

      this.setState({ sorts: { start: null, recent: newVal, state: null } });
    },

    toggleSortByState: function() {
      var current = this.state.sorts.state;
      var newVal;

      if (!current) newVal = 'DESC';
      else newVal = current === 'ASC' ? 'DESC' : 'ASC';

      this.setState({ sorts: { start: null, recent: null, state: newVal } });
    },

    sortEvents: function(events) {
      var sorts = this.state.sorts;
      var statuses = ['C', 'L', 'P', 'N'];
      if (sorts.state) events = _.sortBy(events, function(elem) {
        return statuses.indexOf(elem.status);
      });
      if (sorts.state === 'DESC') events.reverse();

      if (sorts.start) events = _.sortBy(events, function(elem) {
        if (elem.date_time_start == null) return Infinity;
        return -moment(elem.date_time_start).toDate().getTime();
      });
      if (sorts.start === 'DESC') events.reverse();

      if (sorts.recent) events = _.sortBy(events, 'id');
      if (sorts.recent === 'DESC') events.reverse();

      return events;
    },

    renderSortOptions: function() {
      var sorts = this.state.sorts;
      var btnClass = 'btn btn-sort';
      var recentClass = btnClass;
      var startClass = btnClass;
      var stateClass = btnClass;
      var arrowUp = <i className="fa fa-arrow-up"></i>;
      var arrowDown = <i className="fa fa-arrow-down"></i>;

      if (sorts.recent)
        recentClass = [btnClass, 'active', sorts.recent.toLowerCase()].join(' ');

      if (sorts.start)
        startClass = [btnClass, 'active', sorts.start.toLowerCase()].join(' ');

      if (sorts.state)
        stateClass = [btnClass, 'active', sorts.state.toLowerCase()].join(' ');

      return (
        <div className='sortOptions'>
          <span className="label-sort">Sort by:</span>
          <div className='sort-group'>
            <a className={recentClass} onClick={this.toggleSortByRecent}>{arrowUp}{arrowDown}Most Recent</a>
            <a className={startClass} onClick={this.toggleSortByStartDate}>{arrowUp}{arrowDown}Start Date</a>
            <a className={stateClass} onClick={this.toggleSortByState}>{arrowUp}{arrowDown}Event State</a>
          </div>
        </div>
      );
    },

    // create embedCode
    getEmbedCode: function (userType) {
      var serverUrl = this.props.adminElem.getAttribute('data-server-url');
      var userEmbed = '';

      if (userType == 'host')
        userEmbed = '/host';
      if (userType == 'celebrity')
        userEmbed = '/celebrity';

      return [
        '<script src="', serverUrl,
        '/embed' + userEmbed + '.js?container=chatshow&userid=' + this.props.adminElem.getAttribute('data-admin-id'),
        '"></script><div id="chatshow"></div>'
      ].join('');
    },

    render: function() {
      var sortOptions = this.renderSortOptions();
      var events = this.state.events || [];
      var _this = this;
      var currentEvents;
      var archivedEvents;
      var listEvents;
      var listCurrentEvents;
      var listArchivedEvents;


      if (!this.state.loadingEvents) {
        var noEvents = <div className='no-events'><span>No events here. </span><a href="/admin/events/new" className="btn btn-info">Add new event</a></div>;
        if (events.length > 0) {
          events = this.sortEvents(events);

          currentEvents = this.currentEvents(events);

          archivedEvents = events.filter(function(event) {
            return event.status == 'C' && event.archive_id;
          });

          listEvents = events.map(function(event) {
            return React.createElement(EventListItem, {
              key: event.id + "all",
              info: event,
              OT: _this.props.OT,
              onEventDelete: _this.eventDelete,
              onEventChangeStatus: _this.eventChangeStatus
            });
          });

          listCurrentEvents = currentEvents.map(function(event) {
            return React.createElement(EventListItem, {
              key: event.id + "current",
              info: event,
              OT: _this.props.OT,
              onEventDelete: _this.eventDelete,
              onEventChangeStatus: _this.eventChangeStatus
            });
          });

          if (!listCurrentEvents.length) listCurrentEvents = noEvents;

          listArchivedEvents = archivedEvents.map(function(event) {
            return React.createElement(EventListItem, {
              key: event.id + "closed",
              info: event,
              OT: _this.props.OT,
              onEventDelete: _this.eventDelete,
              onEventChangeStatus: _this.eventChangeStatus
            });
          });

        } else {
          listEvents = listCurrentEvents = noEvents;
        }
      } else {
        listEvents = <p>Loading events from server...</p>;
      }

      var toastContainer = React.createElement(ToastContainer, { ref: 'toastContainer', toastMessageFactory: ToastMessageFactory, className: 'toast-top-right' });

      return (
        <div>
        {toastContainer}
        <div className="panel panel-transparent panel-dashboard">
          <div id="alerttopright" className={"kode-alert " + this.state.notification.type + " kode-alert-top-right"}>
              <a href="#" className="closed">&times;</a>
              {this.state.notification.message}
            </div>
          <div className="panel-body">
            <div role="tabpanel">
              <ul className="nav nav-pills" role="tablist">
                <li role="presentation" className="active">
                  <a href="#all" aria-controls="all" role="tab" data-toggle="tab">All Events</a>
                </li>
                <li role="presentation">
                  <a href="#current" aria-controls="current" role="tab" data-toggle="tab">Current Events</a>
                </li>
                <li role="presentation">
                  <a href="#archived" aria-controls="archived" role="tab" data-toggle="tab">Archived Events</a>
                </li>
              </ul>
              {sortOptions}
              <div className="tab-content boxWrap">
                <div role="tabpanel" className="tab-pane active" id="all">
                  {listEvents}
                </div>
                <div role="tabpanel" className="tab-pane" id="current">
                  {listCurrentEvents}
                </div>
                <div role="tabpanel" className="tab-pane" id="archived">
                  {listArchivedEvents}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      );
    }
});

module.exports = EventList;
