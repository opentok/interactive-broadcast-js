function DateTimeUtils() {
}

DateTimeUtils.prototype.formatTime = function(sTime) {
  var aTime = sTime.split(":");  
  var nHour = parseInt(aTime[0]);
  var retTime;
  var ampm;
  if(nHour < 12) {
    ampm = "AM";
  } else {
    ampm = "PM";
    nHour = nHour-12;
  }
  if(nHour == 0) nHour = 12;
  return nHour + ':' + aTime[1] + ' ' + ampm;
}



DateTimeUtils.prototype.formatDate = function (sDate) {
  var dateTimeUtils = new DateTimeUtils();
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var aDatetime = sDate.split(" ");
  var aDate = aDatetime[0].split("-");
  
  sDate = monthNames[parseInt(aDate[1])-1] + " " + aDate[2] + ', ' + aDate[0];
  return sDate + ' ' + dateTimeUtils.formatTime(aDatetime[1]);
}


module.exports = DateTimeUtils
