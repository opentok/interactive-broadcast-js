/** @jsx React.DOM */
var AjaxHandler = require("./../common/ajax-handler");
var React = require("react");

var SetPasswordForm = React.createClass({
	ajaxHandler: new AjaxHandler(),

    getInitialState: function() {
        return {
            data:{
                old_password: '',
                new_password: '',
                new_password_confirm: ''
            },
            has_errors: false,
            errors: []
        };
    },

    hasMayusc: function(str) {
        for (var i = 0; i < str.length; i++) {
            if (str[i] >= 'A' && str[i] <= 'Z') {
                return true;
            }
        }
        return false;
    },

    hasNumber: function(str) {
        for (var i = 0; i < str.length; i++) {
            if (parseInt(str[i]) >= 0 && parseInt(str[i]) <= 9) {
                return true;
            }
        }
        return false;
    },

    hasBlankSpaces: function(str) {
        for (var i = 0; i < str.length; i++) {
            if (str[i] == ' ') {
                return true;
            }
        }
        return false;
    },

    validateInputs: function() {
        var data = this.state.data;
        var _errors = [];
        var old_password = data['old_password'];
        var new_password = data['new_password'];
        var new_password_confirm = data['new_password_confirm'];

        if (old_password.length <= 0)             _errors.push('Old Password can\'t be blank.');
        if (new_password.length < 8)              _errors.push('New Password must have at least 8 characters.');
        if (this.hasBlankSpaces(new_password))    _errors.push('New Password can\'t have spaces.');
        if (!this.hasNumber(new_password))        _errors.push('New Password must have at least 1 Number.');
        if (!this.hasMayusc(new_password))        _errors.push('New Password must have at least 1 Uppercase character.');
        if (new_password != new_password_confirm) _errors.push('Passwords don\'t match.');

        var _has_errors = _errors.length > 0 ? true : false;

        this.setState({
            has_errors: _has_errors,
            errors: _errors
        });

        return _has_errors;
    },

    handleInputChange: function (name, e) {
        var change = this.state.data;
        change[name] = e.target.value;
        this.setState(change);
    },

    handleResponse: function(results) {
        var _this = this;
        var _errors = this.state.errors;
        if (results.success) {
            window.location.href = "/admin";
        } else {
            _errors.push(results.error);
            _this.setState({has_errors: true, errors: _errors});
        }
    },

    handleClick: function(event) {
        var _this = this;
        event.preventDefault();
        if(!this.validateInputs()) {

            _this.ajaxHandler.postRequest(
                "/admin/change-password",
                _this.state.data,
                function(data) {
                    data = typeof(data) === "string" ? JSON.parse(data) : data;
                    _this.handleResponse(data);
                },
                function(err) {
                    console.log('ERROR on Request:', err);
                }
            );
        }
    },

	render: function() {
        var error_class = this.state.has_errors ? "error-text" : "hide";
        var error_list = this.state.errors.map(function(error) {
            return (
                <li key={error}>{error}</li>
            );
        });

		return (
            <div className="login-form">
                <form action="">
                    <div className="top">
                        <img src="/img/tb-icon.png" alt="icon" className="icon"/>
                    </div>
                    <div className="form-area">
                        <div className="info-text">
                            For security reasons, please set a new password.
                        </div>
                        <div className={error_class}>
                            <ul>
                                {error_list}
                            </ul>
                        </div>
                        <div className="group">
                            <input id="password" type="password" autoComplete="off" className="form-control" placeholder="Old Password" onChange={this.handleInputChange.bind(this, 'old_password')} />
                                <i className="fa fa-key"></i>
                        </div>
                        <hr/>
                        <div className="group">
                            <input id="new-password" type="password" autoComplete="off" className="form-control" placeholder="New Password" onChange={this.handleInputChange.bind(this, 'new_password')} />
                                <i className="fa fa-key"></i>
                        </div>
                        <div className="group">
                            <input id="new-password-confirm" type="password" autoComplete="off" className="form-control" placeholder="Confirm Password" onChange={this.handleInputChange.bind(this, 'new_password_confirm')} />
                                <i className="fa fa-key"></i>
                        </div>
                        <button id="set-password" type="submit" className="btn btn-default btn-block" onClick={this.handleClick}>SET NEW PASSWORD</button>
                    </div>
                </form>
            </div>
		);
	}
});

module.exports = SetPasswordForm;