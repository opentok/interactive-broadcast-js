/** @jsx React.DOM */
var moment              = require('moment');
var React               = require('react');
var _                   = require('underscore');
var secrets             = require('secrets.js');
var ReactS3Uploader     = require('react-s3-uploader');
var ReactZeroClipboard  = require('react-zeroclipboard');
var slugify             = require('underscore.string/slugify');
var DateRangePicker     = require('react-bootstrap-daterangepicker');
var ReactToastr         = require('react-toastr');
var ToastContainer      = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

var AjaxHandler = require('./../common/ajax-handler');

var FormMixin = {
  ajaxHandler: new AjaxHandler(),

  handleInputChange: function (event) {
    var name = event.target.name;
    var change = this.state.data;
    change[name] = event.target.value;
    if (name === 'event_name') {
      change[name] = event.target.value.substr(0, 50)
      this.handleUrlChange(change[name]);
    }
    this.setState(change);
  },
  validateUrl:function(event){

      var url = event.target.value;
      if(_.isEmpty(url)) return;
      var urlregex = new RegExp("^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
      if(urlregex.test(url)){
          this.setState({"invalid_url":false})
          this.handleInputChange(event);
      }else{
        this.setState({"invalid_url":true})
      }
  },
  showErrorNotification: function (error) {
    if(error.error == "Invalid APIKEY OR SECRET"){
      text = "Your key seems to be invalid, please check with your account manager.";
    }else{
      text = "The fan URL is already in use. Please enter a different URL.";
    }
    this.refs.toastContainer.error(
      text,
      'Error',
      {
        tapToDismiss: true,
        closeButton: true,
        showAnimation: 'animated fadeInDown',
        hideAnimation: 'animated fadeOutUp',
        clearAlert: function() {
          this.refs.container.clear();
        }
      }
    );
  },

  handleUrlChange: function(name){
    var _base = this.state.base_url;
    var _key = secrets.random(50);
    var shares = secrets.share(secrets.random(50), 3, 5);
    var change = this.state.data;


    change['fan_url'] = slugify(name);
    change['host_url'] =  shares[1];
    change['celebrity_url'] =  shares[2];

    this.setState(change);
    this.checkRequired();
  },

  handleCheckboxChange: function (event) {
    var change = this.state.data;
    change['archive_event'] = !this.state.data.archive_event;
    this.setState(change);
  },

  handleComposedChange: function (event) {
      var change = this.state.data;
      change['composed'] = !this.state.data.composed;
      this.setState(change);
  },

  onUploadProgress: function (percent, message) {
    this.setState({upload_percent:percent,btn_disabled: true});
  },

  onEndEventImageUploadProgress: function (percent, message) {
    this.setState({end_event_image_upload_percent:percent,btn_disabled: true});
  },

  onUploadFinish: function (signResult) {
    this.setState({upload_percent: 0});
    var change = this.state.data;
    // NOTE: this below should have double // so do not delete xD
    // TODO: check what happen with this
    change['event_image'] = signResult.publicUrl;
    this.setState(change);
    if(!_.isEmpty(this.state.data.event_name)){
        this.setState({btn_disabled: false});
    }
  },

  onEndEventImageUploadFinish: function (signResult) {
    this.setState({end_event_image_upload_percent: 0});
    var change = this.state.data;
    // NOTE: this below should have double // so do not delete xD
    // TODO: check what happen with this
    change['event_image_end'] = signResult.publicUrl;
    this.setState(change);
    if(!_.isEmpty(this.state.data.event_name)){
        this.setState({btn_disabled: false});
    }
  },

  checkRequired: function () {
    if (!_.isEmpty(this.state.data.event_name)) {
      this.setState({btn_disabled: false});
    }
  },

  componentDidMount: function() {
    var _this = this;
    var startDate = _this.state.data.date_time_start ? new Date(_this.state.data.date_time_start): moment().format('YYYY-MM-DD H:mm:ss');
    var endDate = _this.state.data.date_time_end ? new Date(_this.state.data.date_time_end) : moment().format('YYYY-MM-DD H:mm:ss');

    // TODO: use the react component to this
    $("#date_picker").daterangepicker({
      timePicker: true,
      timePickerIncrement: 10,
      format: 'YYYY-MM-DD H:mm:ss',
      startDate: startDate,
      endDate: endDate
    }, function(startDate, endDate, label) {
        var change = _this.state.data;
        if(startDate == endDate){
            change['daterange'] = "Date Not Set";
        }else{
            change['date_time_start'] = startDate.format('YYYY-MM-DD H:mm:ss');
            change['date_time_end'] = endDate.format('YYYY-MM-DD H:mm:ss');
            change['daterange'] = moment(startDate).format('MMM DD, YYYY hh:mm A') + ' - ' + moment(endDate).format('MMM DD, YYYY hh:mm A');
        }
        _this.setState(change);
    });
  },

  copiedToClipboard: function(e) {
    this.refs.toastContainer.success(
      'URL successfully copied to clipboard',
      'Success',
      {
        tapToDismiss: true,
        closeButton: true,
        showAnimation: 'animated fadeInDown',
        hideAnimation: 'animated fadeOutUp',
        clearAlert: function() {
          this.refs.container.clear();
        }
      }
    );
  },

  render: function () {
    var baseFun = window.location.origin + '/show/'+this.props.elem.getAttribute("admins_hash")+'/';
    var postProductionBase = window.location.origin + '/post-production/';
    var baseCelebrity = window.location.origin + '/show-celebrity/';
    var baseHost = window.location.origin + '/show-host/';
    var upClass = this.state.upload_percent > 0 ? 'progress' : 'hide';
    var endEventImageUpClass = this.state.end_event_image_upload_percent > 0 ? 'progress' : 'hide';

    var uploader = React.createElement(
      ReactS3Uploader, {
        accept: 'image/*', signingUrl: '/s3/sign',
        onFinish: this.onUploadFinish, onProgress: this.onUploadProgress
      }
    );

    var endEventImageUploader = React.createElement(
      ReactS3Uploader, {
        accept: 'image/*', signingUrl: '/s3/sign',
        onFinish: this.onEndEventImageUploadFinish, onProgress: this.onEndEventImageUploadProgress
      }
    );

    var fanUrlCopyBtn = React.createElement(
      ReactZeroClipboard, {
        text: baseFun + this.state.data.fan_url,
        onAfterCopy: this.copiedToClipboard
      },
      <a href='#' className='btn btn-light input-group-addon'>Copy Url</a>
    );

      var postUrlCopyBtn = React.createElement(
      ReactZeroClipboard, {
        text: postProductionBase + this.state.data.fan_url,
        onAfterCopy: this.copiedToClipboard
      },
      <a href='#' className='btn btn-light input-group-addon'>Copy Url</a>
    );

    var hostUrlCopyBtn = React.createElement(
      ReactZeroClipboard, {
        text: baseHost + this.state.data.host_url,
        onAfterCopy: this.copiedToClipboard
      },
      <a href='#' className='btn btn-light input-group-addon'>Copy Url</a>
    );

    var celebrityUrlCopyBtn = React.createElement(
      ReactZeroClipboard, {
        text: baseCelebrity + this.state.data.celebrity_url,
        onAfterCopy: this.copiedToClipboard
      },
      <a href='#' className='btn btn-light input-group-addon'>Copy Url</a>
    );

    var redirectUrlCopyBtn = React.createElement(
      ReactZeroClipboard, {
        text: this.state.data.redirect_url,
        onAfterCopy: this.copiedToClipboard
      },
      <a href='#' className= {this.state.invalid_url? 'btn btn-light input-group-addon disabled' :'btn btn-light input-group-addon'}>{this.state.invalid_url? "Invalid Url" : "Copy Url" }</a>
    );

    var toastContainer = React.createElement(ToastContainer, { ref: 'toastContainer', toastMessageFactory: ToastMessageFactory, className: 'toast-top-right' });
    var img_preview = this.state.data && this.state.data.event_image ? <div className="col-sm-2"><img className="img-responsive img-thumbnail" src={this.state.data.event_image}/></div> : "";
    var end_img_preview = this.state.data && this.state.data.event_image_end ? <div className="col-sm-2"><img className="img-responsive img-thumbnail" src={this.state.data.event_image_end}/></div> : "";
    var post_production_enabled = this.props.elem.getAttribute("postproductionurl_enabled") === 'true' ? true : false;

      return (
      <div>
        {toastContainer}
        <div className="row">
            <form>
                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">Name</label>
                    <div className="col-sm-10">
                        <input id="input-event-name" type="text" className="form-control" name="event_name" value={this.state.data.event_name} onChange={this.handleInputChange}/>
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">Date and Time(Optional)</label>
                    <div className="col-sm-10">
                        <div className="control-group">
                            <div className="controls">
                                <div className="input-prepend input-group">
                                    <span className="add-on input-group-addon"><i className="fa fa-calendar"></i></span>
                                    <input
                                      id="date_picker" type="text"
                                      name="date_picker" className="form-control date-range-and-time-picker"
                                      value={this.state.data.daterange}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">Event Image</label>
                    {img_preview}
                    <div className="col-sm-8">
                        {uploader}
                        <div className={upClass}>
                            <div className="progress-bar progress-bar-info" role="progressbar" aria-valuenow={this.state.upload_percent}
                                 aria-valuemin="0" aria-valuemax="100" style={{width: this.state.upload_percent + '%'}} >
                                {this.state.upload_percent} Complete
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">End Event Image</label>
                    {end_img_preview}
                    <div className="col-sm-8">
                        {endEventImageUploader}
                        <div className={endEventImageUpClass}>
                            <div className="progress-bar progress-bar-info" role="progressbar" aria-valuenow={this.state.end_event_image_upload_percent}
                                 aria-valuemin="0" aria-valuemax="100" style={{width: this.state.end_event_image_upload_percent + '%'}} >
                                {this.state.end_event_image_upload_percent} Complete
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group clearfix">
                    <div className="col-sm-12">
                        <label className="divider-line display-block  control-label form-label">Event URLs</label>
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label  className="col-sm-2 control-label form-label">Fan URL</label>
                    <div className="col-sm-7 input-group">
                        <span id="basic-addon1" className="input-group-addon">{baseFun}</span>
                        <input type="text" className="form-control" name="fan_url" onChange={this.handleInputChange} value={this.state.data.fan_url}/>
                        {fanUrlCopyBtn}
                    </div>
                </div>

                <div className={post_production_enabled ? "form-group clearfix" : "hidden"}>
                    <label  className="col-sm-2 control-label form-label">Fan Audio Only URL</label>
                    <div className="col-sm-7 input-group">
                        <span id="basic-addon1" className="input-group-addon">{postProductionBase}</span>
                        <input type="text" className="form-control" name="post_production_url" onChange={this.handleInputChange} value={this.state.data.fan_url}/>
                        {postUrlCopyBtn}
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">Host URL</label>
                    <div className="col-sm-7 input-group">
                        <span id="basic-addon1" className="input-group-addon">{baseHost}</span>
                        <input type="text" disabled="disabled" className="form-control" name="host_url" onChange={this.handleInputChange} value={this.state.data.host_url}/>
                        {hostUrlCopyBtn}
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label">Celebrity URL</label>
                    <div className="col-sm-7 input-group">
                        <span id="basic-addon1" className="input-group-addon">{baseCelebrity}</span>
                        <input type="text" disabled="disabled" className="form-control" name="celebrity_url" onChange={this.handleInputChange} value={this.state.data.celebrity_url}/>
                        {celebrityUrlCopyBtn}
                    </div>

                </div>

                <div className={this.state.invalid_url? "form-group clearfix has-error" : "form-group clearfix"}>
                    <label  className="col-sm-2 control-label form-label">Redirect URL</label>
                    <div className="col-sm-7 input-group">
                        <input type="text" className={this.state.invalid_url ? "form-control" : "form-control danger"} name="redirect_url" placeholder="This field is optional" onChange={this.handleInputChange} onBlur={this.validateUrl} value={this.state.data.redirect_url}/>
                        {redirectUrlCopyBtn}
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label"></label>
                    <div className="col-sm-8">
                        <div className="checkbox checkbox-primary">
                            <input type="checkbox" checked={this.state.data.archive_event}/>
                            <label onClick={this.handleCheckboxChange}>
                                Archive Event
                            </label>
                        </div>
                    </div>
                </div>

                <div className={this.state.data.archive_event ? 'form-group clearfix' : 'hidden'}>
                    <label className="col-sm-2 control-label form-label"></label>
                    <div className="col-sm-8">
                        <div className="checkbox checkbox-primary">
                            <input type="checkbox" checked={!this.state.data.composed}/>
                            <label onClick={this.handleComposedChange}>
                                Archive Individual Streams (Uncheck for Composed Video)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-group clearfix">
                    <label className="col-sm-2 control-label form-label"></label>
                    <div className="col-sm-10">
                        <a id="save-event" href="#" className="btn btn-success" disabled={this.state.btn_disabled} onClick={this.handleClick}>Save Event</a>
                    </div>
                </div>
            </form>
        </div>
      </div>
    );
  }
}

module.exports = FormMixin;
