/** @jsx React.DOM */
var AjaxHandler = require("./../common/ajax-handler");
var React = require("react");

var LoginForm = React.createClass({
    ajaxHandler: new AjaxHandler(),
    getInitialState: function() {
        return {
            data:{},
            remember:true,
            has_error:false
        }
    },
    handleResponse:function(results){
        if(results.id){
            window.location.href = "/admin";
        }else{
            this.setState({has_error:true})
        }
    },
    handleClick: function(event) {
        _this = this;
        event.preventDefault();
        this.ajaxHandler.postRequest(
            "/create_session",
            _this.state.data,
            function(data) {
                data = typeof(data) === "string" ? JSON.parse(data) : data;
                _this.handleResponse(data);
            },
            function(err) {
                console.log(err);
                _this.setState({has_error:true})
            }
        )
    },
    handleInputChange: function (name, e) {
        var change = this.state.data;
        change[name] = e.target.value;
        this.setState(change);
    },
    handleRememberChange: function (name, e) {
        var change = this.state.data;
        change["remember"] = !this.state.data.remember;
        this.setState(change);
    },
    render: function() {
        var error_text = this.state.has_error ? "Please Check Your Login Information" : "";
        var error_class = this.state.has_error ? "error-text" : "hide";
        return (
            <div className="login-form">
                <form action="">
                    <div className="top">
                        <img src="img/tb-icon.png" alt="icon" className="icon"/>
                    </div>
                    <div className="form-area">
                        <div className={error_class}>
                            {error_text}
                        </div>
                        <div className="group">
                            <input id="username" type="text" className="form-control" placeholder="Email" onChange={this.handleInputChange.bind(this, 'username')}/>
                                <i className="fa fa-user"></i>
                        </div>
                        <div className="group">
                            <input id="password" type="password" autoComplete="off" className="form-control" placeholder="Password" onChange={this.handleInputChange.bind(this, 'password')}/>
                                <i className="fa fa-key"></i>
                        </div>
                        <button id="sign-in" type="submit" className="btn btn-default btn-block" onClick={this.handleClick}>SIGN IN</button>
                    </div>
                </form>
            </div>
        );
    }
});

module.exports = LoginForm;
