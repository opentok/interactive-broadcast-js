/** @jsx React.DOM */
var React = require("react");
var _ = require("underscore");
var moment = require("moment");
var ReactToastr = require('react-toastr');
var ToastContainer = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

var AjaxHandler = require("./../common/ajax-handler");
var AdminControls = require('./../admin/controls');
var User = require('./user_line');

var UsersList = React.createClass({
  ajaxHandler: new AjaxHandler(),
  getInitialState: function() {
    return {
      users:[],
      notification : {type:null,
        message:null},
      sorts: {
        recent: 'DESC',
        start: null,
        state: null
      },
      newUser:{
        name:"",
        username:"",
        password:"",
        ot_apikey:"",
        ot_secret:"",
        hls_enabled:true,
        http_support:false,
      }
    };
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

  deleteUser: function(user) {
    var _this = this;
    var nIdEvent = parseInt(user.id);

    if(nIdEvent) {
      $.post("/admin/user-delete", {id: nIdEvent}, function (data) {
        if (data["success"]) {
          _this.refreshListFromServer();
          _this.setNotification("success", "User successfully Deleted!");
        }
      });
    }
  },
  handleError: function(data) {
    if(data.error) {
      if(data.error.indexOf('admins_username_idx') !== -1){
        this.setNotification("error", "The username is already in use. Please enter a different username.");
      } else if(data.error.indexOf('invalid_api_key') !== -1) {
        this.setNotification("error", "The API KEY or API SECRET are invalid.");
      }
    }
  },
  addUser:function(){
    var _this = this;


    $.post("/admin/user-create", this.state.newUser,function(data){
      if(data["name"]){
        var nUser = {username:"", name:"",password:""};
        _this.refreshListFromServer();
        _this.setNotification("success","User successfully Created!");
        _this.setState({newUser:nUser});
      } else {
        _this.handleError(data);
      }
    });
  },
  editUser:function(user){
    var _this = this;
    return $.post("/admin/user-edit", user,function(data){
      if(data["success"]){
        _this.refreshListFromServer();
        _this.setNotification("success","User successfully Edited!");
      } else {
        _this.handleError(data);
      }
    });
  },
  refreshListFromServer: function() {
    var _this = this;
    $.get("/admin/get-all-users", function(result) {
      var results = typeof(result) === "string" ? JSON.parse(result) : result;
        _this.setState({
          users: results,
          laoding : false
      })
    });
  },

  componentDidMount: function() {
    this.refreshListFromServer();
  },

  componentWillUnmount: function() {
    this.socket && this.socket.disconnect();
  },

  onChange: function(e) {
    var name = e.target.name;
    var change = this.state.newUser;
    if(e.target.type == "checkbox"){
      change[name] = e.target.checked;
    }else{
      change[name] = e.target.value;
    }
    this.setState({newUser:change});
  },

  renderSortOptions: function() {
    var sorts = this.state.sorts;
    var btnClass = 'btn btn-sort';
    var recentClass = btnClass;
    var arrowUp = <i className="fa fa-arrow-up"></i>;
    var arrowDown = <i className="fa fa-arrow-down"></i>;

    if (sorts.recent)
      recentClass = [btnClass, 'active', sorts.recent.toLowerCase()].join(' ');

    return (
      <div className='sortOptions'>
        <span className="label-sort">Sort by:</span>
        <div className='sort-group'>
          <a className={recentClass} onClick={this.toggleSortByRecent}>{arrowUp}{arrowDown}Most Recent</a>
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
    var users = this.state.users || [];
    var _this = this;
    var currentUsers;
    var listUsers;
    var _apiKey = this.props.elem.getAttribute("apiKey");

    if (!this.state.loading) {
       var noUsers = <div className='no-events'><span>No users here. </span><a href="/admin/users/new" className="btn btn-info">Add new user</a></div>;

      if (users.length > 0) {
        currentUsers = users;

        listUsers = _.map(currentUsers,function(user) {
          return React.createElement(User, {
            key: user.id,
            user: user,
            editUser: _this.editUser,
            deleteUser: _this.deleteUser,
          })
        });

      } else {
        listUsers = noUsers;
      }
    } else {
      listUsers = <p>Loading events from server...</p>;
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
              <div className="tab-content boxWrap">
                  {listUsers}
                <div className="event-line">
                  <div className="event-content">
                    <input type="text" name="username" placeholder="Username" onChange={this.onChange} className="actions" value={this.state.newUser.username}/>&nbsp;
                    <input type="text" name="name" placeholder="Name" onChange={this.onChange} value={this.state.newUser.name} className="actions"/>&nbsp;
                    <input type="password" name="password" placeholder="Password" onChange={this.onChange} value={this.state.newUser.password} className="actions"/>&nbsp;
                    <input type="text" name="ot_apikey" placeholder="OpenTok API Key" onChange={this.onChange} value={this.state.newUser.ot_apikey} className="actions"/>&nbsp;
                    <input type="text" name="ot_secret" placeholder="OpenTok Secret" onChange={this.onChange} value={this.state.newUser.ot_secret} className="actions"/><br/>
                    <input type="checkbox" name="hls_enabled" checked={this.state.newUser.hls_enabled || false } onChange={this.onChange}/> <strong> Broadcast Enabled </strong>&nbsp;&nbsp;
                    <input type="checkbox" name="http_support" checked={this.state.newUser.http_support || false} onChange={this.onChange}/> <strong> HTTP support Enabled </strong>&nbsp;
                    <button className="btn btn-success" onClick={this.addUser}> Add User </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = UsersList;
