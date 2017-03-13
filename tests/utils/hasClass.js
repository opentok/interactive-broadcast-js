"use strict";

var ElementFinder = $('').constructor;

ElementFinder.prototype.hasClass = function(cssClass) {
  return this.getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf(cssClass) !== -1;
  });
}
