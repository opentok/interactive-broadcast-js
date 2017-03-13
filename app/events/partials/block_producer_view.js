/** @jsx React.DOM */
var React       = require('react');
var BlockProducerView = React.createClass({

    getInitialState: function() {
        return {
            
        };
    },

    render: function() {
        var event_name = this.props.event.event_name;
        var username = this.props.username;
        return (    
            <div className="block-form">
                <form action="">
                    <div className="top">
                        <img src="/img/tb-icon.png" alt="icon" className="icon"/>
                    </div>
                    <div className="message">
                        <p>User: <strong>{username}</strong> is already in event: <strong>{event_name}</strong> on another browser window or tab.</p>
                        <p>There can only be one tab open with Interactive Broadcast Solution at a time.</p>
                    </div>
                </form>
            </div>
        );
    }
});

module.exports = BlockProducerView;
