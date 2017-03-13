/** @jsx React.DOM */
var AjaxHandler = require('./../../common/ajax-handler');
var Sortable = require('./../../common/sortable');
var UserButton  = require('./user_button');
var React       = require('react');
var _           = require('underscore');

var UserList = React.createClass({

    getInitialState: function() {
        return {
            users: this.props.users,
            streamUIOptions : {
                showControls: false,
                width: 320,
                height: 240,
                frameRate: 15,
                insertMode: 'append',
                audioVolume:100
            },
            data:this.props.data,
            components:[],
            backstageSession:this.props.backstageSession,
            user_order:[]
        };
    },

    renderUserButton: function(user,i) {
        var _this = this;
        var data = this.props.data;
        var apiKey = data.apiKey;
        var sessionIdHost = data.sessionIdHost;

        return (
            React.createElement(
                UserButton, {
                    onMoveToFan: this.props.onMoveToFan,
                    apiKey: apiKey,
                    user: user,
                    sessionIdHost: sessionIdHost,
                    OT: _this.props.OT,
                    publisher: _this.props.publisher,
                    backstageSession: _this.props.backstageSession,
                    onstageSession: _this.props.onstageSession,
                    feeds: _this.props.feeds,
                    data:_this.props.data,
                    index_key:user.identifier,
                    key: 'UserButton' + user.connection.connectionId,
                    setUserBackstage: this.props.setUserBackstage,
                    change_event: this.props.change_event,
                    kickFan: this.props.kickFan,
                    subscribeUserCall: this.props.subscribeUserCall,
                    unsubscribeUserCall: this.props.unsubscribeUserCall,
                    isInFanCall: this.props.isInFanCall,
                    removeUserFromState: this.props.removeUserFromState
                }
            )
        );
    },

    handleReorder: function(e,components) {
        components = _.filter(components, function(component){
            return component;
        });
        var ids = _.map(components,function(component){
            return component.key
        });
        this.setState({ components:components,user_order:ids });
    },

    getComponents:function(){
        var _this = this;

        var all_components = _.uniq(this.props.users).map(function(user,i){
            if (user.isSpecialChat) return;
            return _this.renderUserButton(user, i);
        });

        all_components = _.compact(all_components);

        if (!this.state.user_order) {
            return all_components;
        } else {
            var c = _.map(this.state.user_order, function (user) {
                return _.filter(all_components,function(c){return c.key == user})[0];
            });
            return _.union(c,all_components);
        }
    },

    getSpecialChatsCount: function() {
        var users = this.props.users;
        var specialChatsCount = 0;
        for (var i = 0; i < users.length; i++) {
            if (users[i].isSpecialChat) {
                specialChatsCount++;
            }
        }
        return specialChatsCount;
    },

    render: function() {
        var _this = this;
        var activeFans = this.props.users.length - _this.getSpecialChatsCount();
        var components = _this.getComponents();
        var sorters = React.createElement(Sortable,{
          components: components,
          onReorder:this.handleReorder,
          className:"sidebar-list",
          verify:function(){
            return true
          }})

        return (
            <div className='sidepanel fan-panel'>
                <div className='sidepanel-m-title'>
                    Active Fans ({activeFans})
                  <span className='right-icon'>
                    <a href='#'>
                        <i className='fa fa-arrows-alt'></i>
                    </a>
                  </span>
                </div>
                <div id="fan_list" className="list-fan-online oko">
                    {sorters}
                </div>

            </div>
        );
    }
});

module.exports = UserList;
