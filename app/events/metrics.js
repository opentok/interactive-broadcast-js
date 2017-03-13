/** @jsx React.DOM */
var React  = require('react');
var _ = require('underscore');
var moment = require('moment');
var charts  = require('./partials/charts');
var AjaxHandler = require('../common/ajax-handler');


var ViewMetrics = React.createClass({
    getInitialState: function () {
        return {
            eventData: this.props.eventData,
            event:{},
        };
    },
    componentDidMount: function(){
        var _event_id = this.props.elem.getAttribute("event");
        this.ajaxHandler = new AjaxHandler();
        this.ajaxHandler.getRequest(
            "/admin/metrics-by-event/"+_event_id,
            this.onEventDataReceived,
            this.onAjaxRequestError
        );
    },
    onAjaxRequestError: function(error) {
        console.log('onAjaxRequestError:error', error);
    },
    onEventDataReceived: function(results) {
        this.setState({ event: results });
        console.log(results);
    },
    getAverageWaitTime:function(){
        var _metrics = this.state.event.metrics;
        var users = _.filter(_metrics,function(user){
            return user.onstage_time != null;
        })
        var times = []
        _.each(users,function(user){
            var a = moment(user.get_in_line_time);
            var b = moment(user.onstage_time);
            times.push( b.diff(a, 'minutes'))
        });
        return _.reduce(times, function(memo, num)
            {
                return memo + num;
            }, 0) / times.length;
    },
    render_users_by_value:function(value){
        var _by_value = _.countBy(this.state.event.metrics,function(fan){return fan[value]});
        var total_amount = this.state.event.metrics.length;
        return _.map(_by_value,function(v,k) {
            var percentage = Math.round( v*100/total_amount);
            var style = {width: percentage +"%;"};
            return (
                <tr>
                    <td>{k}</td>
                    <td>{v}</td>
                    <td>
                        <div className="progress">
                        <div className="progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100" style={style}>
                        </div>
                        </div>
                    </td>
                    <td>
                      {percentage + "%"}
                    </td>
                </tr>
            )
        })
    },
    render: function () {
        if(!this.state.event.event_info){
            return(<div></div>);
        }
        var _event = this.state.event.event_info[0];
        var _metrics = this.state.event.metrics;
        var _event_duration = (_event.total_duration ? moment.duration(_event.total_duration,'seconds').minutes() : 0 )+ " min";
        var _mobile = _.countBy(_metrics,function(fan){return fan.is_mobile});
        var _in_line_times = _.countBy(_metrics,function(fan){return fan.get_in_line_time != null});
        var _on_stage = _.countBy(_metrics,function(fan){return fan.onstage_time != null});
        var _user_times = _.compact(_.pluck(_metrics,'spent_time'));
        var _average_time_per_user = _.reduce(_user_times, function(memo, num){ return memo + num; }, 0) / _user_times.length ;
        var chart = React.createElement(charts, {data:this.state.event});
        var average_wait_time = this.getAverageWaitTime();
        return (

            <div className="container metricsContainer panel-metrics">

                <div className="panel panel-default">
                    <div className="panel-title">
                        {_event.event_name} Metrics
                    </div>
                    <div className="panel-body">
                        <div className="col-md-4">
                            <ul className="basic-list">
                                <li>
                                    <i className="fa fa-clock-o"></i>
                                    Event Duration
                                </li>
                                <li>Total Duration: {_event_duration}</li>
                                <li>Event Start Time : {_event.show_started ? moment(_event.show_started).format( "YYYY-MM-DD HH:mm") : "Unknown"}</li>
                                <li>Event End Time : {_event.show_ended ? moment(_event.show_ended).format( "YYYY-MM-DD HH:mm") : "Unknown"}</li>
                            </ul>
                        </div>
                        <div className="col-md-4">
                            <ul className="basic-list">
                                <li>
                                    <i className="fa fa-user"></i>
                                    Viewers {_metrics.length}
                                </li>
                                <li>Web Viewers:{_mobile.false || 0}</li>
                                <li>Mobile Viewers:{_mobile.true || 0}</li>
                                <li>Average Viewing Time: {moment.duration(_average_time_per_user,'seconds').minutes()} min</li>
                            </ul>
                        </div>
                        <div className="col-md-4">
                            <ul className="basic-list">
                                <li>
                                    <i className="fa fa-user"></i>
                                    Participants</li>
                                <li>In-line:{_in_line_times.true} </li>
                                <li>On-stage: {_on_stage.true}</li>
                                <li>Average Wait Time: {average_wait_time} min</li>
                            </ul>
                        </div>
                    </div>
                </div>
            <div className="panel panel-default">
                <div className="panel-title">
                    Fans Participation By Event Duration
                </div>
                <div className="panel-body">
                    <div className="col-md-6"><i className="fa fa-square colorsheme color5">&nbsp;</i> Viewers</div>
                    <div className="col-md-6"><i className="fa fa-square colorsheme color15">&nbsp;</i> Participants</div>
                    <div id="col-md-12 myChart">{chart}</div>
                </div>
            </div>
            <div className="panel panel-default">


            <h4>Users By Country</h4>
            <table className="table talbe-striped">
                <thead>
                    <tr>
                        <td>Countries</td>
                        <td>Viewers</td>
                        <td>% Viewers </td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                {this.render_users_by_value('country')}
                </tbody>
                </table>

            <h4>Users By OS</h4>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <td>Operating System</td>
                        <td>Viewers</td>
                        <td>% Viewers</td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    {this.render_users_by_value('os')}
                </tbody>
            </table>

        </div>
        </div>)
    }
});

module.exports = ViewMetrics;