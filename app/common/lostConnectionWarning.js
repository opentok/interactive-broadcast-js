function LostConnectionWarning() {
}

LostConnectionWarning.prototype.show = function() {
  var html = [
      "You are experiencing network connectivity issues. Please try refreshing the page using your browser's refresh button."
    ].join('<br/>');
    swal({
      title: "Aw, what happened?",
      text: html,
      type: "error",
      html: true,
      showConfirmButton: false
    });
}

module.exports = LostConnectionWarning
