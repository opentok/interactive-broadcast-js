function AjaxHandler() {
}

AjaxHandler.prototype.getRequest = function(url, successCallback, errorCallback) {
  $.ajax({
    type:"GET",
    url: url,
    dataType: "json",
    success: successCallback,
    error: errorCallback
  });
}
AjaxHandler.prototype.postRequest = function(url,data,successCallback, errorCallback) {
  $.ajax({
    type:"POST",
    url: url,
    data: data,
    dataType: "json",
    success: successCallback,
    error: errorCallback
  });
}
module.exports = AjaxHandler
