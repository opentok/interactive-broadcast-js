/** @jsx React.DOM */
var React = require("react");

var PublisherVideoBox = React.createClass({
    getInitialState: function() {
        return {
            data:{},
            streamUIOptions : {
                showControls: false,
                width:300,
                height:250
            }
        }
    },
    handleStream:function(){
        var data = this.state.data;
        var streamUIOptions = this.state.streamUIOptions;
        window.session = OT.initSession(data.apiKey, data.sessionId);
        window.publisher = null;

        session.on("streamDestroyed", function (event) {
            console.log("Stream stopped. Reason: " + event.reason);
            session.unpublish(window.publisher);
        });


        session.on("streamCreated", function(event) {
            console.log("STREAMING NOW!");

            window.publisher = OT.initPublisher('userBox', streamUIOptions , function(error) {
                if (error) {
                    console.log("there was an error, we should let the user know")
                } else {
                    console.log('Publisher initialized.');
                }
            });
            session.publish(window.publisher);

            session.subscribe(event.stream,'hostBox',streamUIOptions);
        });
        session.connect(data.token, function(error) {
            console.log(error);
        });
        this.setState({text: "Sending Signal"});
        this.sendSignal()
    },
    componentDidMount:function(){
        this.setState({stream:this.props.stream, identifier:this.props.identifier});
        this.handleStream();
    },
    render:function(){
        return <div id="{this.props.identifier}+_holder" class="videoBox yellow">
            <div id="{this.props.identifier}+_Box"></div>
        </div>
    }
});

module.exports = PublisherVideoBox;
