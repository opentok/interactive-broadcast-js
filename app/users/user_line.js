/** @jsx React.DOM */
var React = require("react");

var UserLine = React.createClass({
  getInitialState: function() {
    return {
      user:[],
      user:{},
      editing:false
    };
  },
  componentDidMount:function(){
    this.setState({user:this.props.user});
  },
  onChange:function(e){
    var name = e.target.name;
    var change = this.state.user;
    if(e.target.type == "checkbox"){
      change[name] = e.target.checked;
    }else{
      change[name] = e.target.value;
    }
    this.setState({user:change});
  },
  editUser:function(e){
    var _this = this;
    this.props.editUser(this.state.user)
    .done(function(data) {
      if(!data.error) {
        _this.toggleEditing();
      }
    });
  },
  deleteUser:function(e){
    var _this = this;
    swal({
      title: "Are you sure you want to delete this user?",
      text: "They will no longer be able to access their events.",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonClass: "btn-danger",
      confirmButtonText: "Delete",
      closeOnConfirm: false
    },
    function(){
      _this.props.deleteUser(_this.state.user);
      swal("Deleted!", "The user has been deleted.", "success");
    });
  },

  toggleEditing:function(){
    var newEdit = !this.state.editing;
    return this.setState({editing:newEdit});
  },
  render: function () {
    var _this = this;
    var user = this.state.user;
    if(user.is_superadmin){
      return <div></div>;
    }else{
      return (<div className="event-line">
        <div className={this.state.editing ? "hidden":"event-title"}>
          {_this.props.user.name} [<strong>{_this.props.user.username}</strong>]
        </div>
        <div className={this.state.editing ?"event-content":"hidden"}>
          <input type="text" name="username" placeholder="Username" enabled="false" readOnly="true" className="actions" value={user.username}/>&nbsp;
          <input type="text" name="name" placeholder="Name" onChange={_this.onChange} value={user.name} className="actions"/>&nbsp;
          <input type="password" name="password" placeholder="Password" onChange={_this.onChange} value={user.password} className="actions"/>&nbsp;
          <input type="text" name="ot_apikey" placeholder="OpenTok API Key" onChange={_this.onChange} value={user.ot_apikey} className="actions"/>&nbsp;
          <input type="text" name="ot_secret" placeholder="OpenTok Secret" onChange={_this.onChange} value={user.ot_secret} className="actions"/><br/>
          <input type="checkbox" name="hls_enabled" checked={user.hls_enabled} onChange={_this.onChange}/> <strong> Broadcast Enabled </strong>&nbsp;
          <input type="checkbox" name="http_support" checked={user.http_support} onChange={_this.onChange}/> <strong> HTTP support Enabled </strong>&nbsp;
          <button className="btn btn-success" onClick={_this.editUser}> Save </button>&nbsp;
          <button className="btn btn-success" onClick={_this.toggleEditing}> Cancel </button>
        </div>
        <div className={this.state.editing ? "hidden" :"event-actions"}>
          <a href="javascript:;" onClick={_this.toggleEditing} className="btn btn-warning actions">
            <i className="fa fa-pencil-square-o"></i>
            Edit
          </a>
          <a href="javascript:;" onClick={_this.deleteUser} className="btn btn-danger actions">
            <i className="fa fa-times-trash-o"></i>
            Delete
          </a>
        </div>
      </div>)
    }
  }
});

module.exports = UserLine;
