var React               = require('react');
var moment              = require("moment");
var _                   = require("underscore");
var s                   = require("underscore.string");

var Charts = React.createClass({
    getInitialState: function () {
        return {};
    },
    loadDefaults:function(){
        Chart.defaults.global = {
            // Boolean - Whether to animate the chart
            animation: true,
            // Number - Number of animation steps
            animationSteps: 60,
            // String - Animation easing effect
            // Possible effects are:
            // [easeInOutQuart, linear, easeOutBounce, easeInBack, easeInOutQuad,
            //  easeOutQuart, easeOutQuad, easeInOutBounce, easeOutSine, easeInOutCubic,
            //  easeInExpo, easeInOutBack, easeInCirc, easeInOutElastic, easeOutBack,
            //  easeInQuad, easeInOutExpo, easeInQuart, easeOutQuint, easeInOutCirc,
            //  easeInSine, easeOutExpo, easeOutCirc, easeOutCubic, easeInQuint,
            //  easeInElastic, easeInOutSine, easeInOutQuint, easeInBounce,
            //  easeOutElastic, easeInCubic]
            animationEasing: "easeOutQuart",
            // Boolean - If we should show the scale at all
            showScale: true,
            // Boolean - If we want to override with a hard coded scale
            scaleOverride: false,
            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: null,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: null,
            // Number - The scale starting value
            scaleStartValue: null,
            // String - Colour of the scale line
            scaleLineColor: "rgba(0,0,0,.1)",
            // Number - Pixel width of the scale line
            scaleLineWidth: 1,
            // Boolean - Whether to show labels on the scale
            scaleShowLabels: true,
            // Interpolated JS string - can access value
            scaleLabel: "<%=value%>",
            // Boolean - Whether the scale should stick to integers, not floats even if drawing space is there
            scaleIntegersOnly: true,
            // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero: false,
            // String - Scale label font declaration for the scale label
            scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            // Number - Scale label font size in pixels
            scaleFontSize: 12,
            // String - Scale label font weight style
            scaleFontStyle: "normal",
            // String - Scale label font colour
            scaleFontColor: "#666",
            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: false,
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: true,
            // Boolean - Determines whether to draw tooltips on the canvas or not
            showTooltips: true,

            // Function - Determines whether to execute the customTooltips function instead of drawing the built in tooltips (See [Advanced - External Tooltips](#advanced-usage-custom-tooltips))
            customTooltips: false,

            // Array - Array of string names to attach tooltip events
            tooltipEvents: ["mousemove", "touchstart", "touchmove"],

            // String - Tooltip background colour
            tooltipFillColor: "rgba(0,0,0,0.8)",

            // String - Tooltip label font declaration for the scale label
            tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // Number - Tooltip label font size in pixels
            tooltipFontSize: 14,

            // String - Tooltip font weight style
            tooltipFontStyle: "normal",

            // String - Tooltip label font colour
            tooltipFontColor: "#fff",

            // String - Tooltip title font declaration for the scale label
            tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // Number - Tooltip title font size in pixels
            tooltipTitleFontSize: 14,

            // String - Tooltip title font weight style
            tooltipTitleFontStyle: "bold",

            // String - Tooltip title font colour
            tooltipTitleFontColor: "#fff",

            // Number - pixel width of padding around tooltip text
            tooltipYPadding: 6,

            // Number - pixel width of padding around tooltip text
            tooltipXPadding: 6,

            // Number - Size of the caret on the tooltip
            tooltipCaretSize: 8,

            // Number - Pixel radius of the tooltip border
            tooltipCornerRadius: 6,

            // Number - Pixel offset from point x to tooltip edge
            tooltipXOffset: 10,

            // String - Template string for single tooltips
            tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",

            // String - Template string for multiple tooltips
            multiTooltipTemplate: "<%= value %>",

            // Function - Will fire on animation progression.
            onAnimationProgress: function(){},

            // Function - Will fire on animation completion.
            onAnimationComplete: function(){}
        }
    },
    componentDidMount: function() {
        this.loadDefaults();
        this.loadChart();
    },
    usersInTime:function(start,end){
        var metrics = this.props.data.metrics;
        return _.filter(metrics,function(user){
            return moment(user.enter_time).isBefore(start) && (user.leave_time ? moment(user.leave_time).isAfter(start) : true);
        });
    },
    usersInLine:function(start,end){
        var metrics = _.filter(this.props.data.metrics,function(u){return u.get_in_line_time});
        return _.filter(metrics,function(user){
            return moment(user.get_in_line_time).isBefore(start) && (user.onstage_time ? moment(user.onstage_time).isAfter(start) : false);
        });
    },
    getTimeData:function(all){
        var self = this;
        var data = [];
        var labels = [];
        var start = moment(this.props.data.event_info[0].show_started);
        var end = moment(this.props.data.event_info[0].show_ended);
        var total_duration_min = Math.floor(this.props.data.event_info[0].total_duration/60);
        if(all){
        _(total_duration_min).times(function(n){
            var start_time = start.add(n,'m');
            data.push(self.usersInTime(start_time,end).length);
            labels.push(start_time.format("H:mm"));
            start.subtract(n,'m');
        });
        }else{
            _(total_duration_min).times(function(n){
                var start_time = start.add(n,'m');
                data.push(self.usersInLine(start_time,end).length);
                labels.push(start_time.format("H:mm"));
                start.subtract(n,'m');
            });
        }
        return {data:data,labels:labels};
    },
    getCountryData:function(){
        var metrics = this.props.data.metrics;
        var _by_country = _.countBy(metrics,function(fan){return fan["country"]});
        return _.map(_by_country,function(v,k) {
            return {
                country:k,
                count:v
            }
        })
    },
    loadChart:function(){
        var timedata = this.getTimeData(true);
        var inlinedata = this.getTimeData(false);
        var data = {
            labels: timedata.labels,
            datasets: [
                {
                    label: "All Fans",
                    fillColor: "rgba(0, 156, 255, 0.2)",
                    strokeColor: "rgba(0, 156, 255, 1)",
                    pointColor: "rgba(0, 156, 255, 1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(0, 156, 255, 1)",
                    data: timedata.data
                },
                {
                    label: "Fans Inline",
                    fillColor: "rgba(182, 137, 44,0.2)",
                    strokeColor: "rgba(182, 137, 44,1)",
                    pointColor: "rgba(182, 137, 44,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(182, 137, 44,1)",
                    data: inlinedata.data
                }
            ]
        };
        var ctx = this.getDOMNode().getContext("2d");
        return new Chart(ctx).Line(data, {});
    },
    render:function(){
        return (<canvas id="myChart" width="450" height="300"></canvas>);
    },

});
module.exports = Charts;
