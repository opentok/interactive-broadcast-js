var Promise = require('bluebird');
var FirefoxProfile = require('firefox-profile');

exports.ffProfile = function() {

    return new Promise(function(resolve) {

        var firefoxProfile = new FirefoxProfile();

        firefoxProfile.setPreference('media.navigator.permission.disabled', true); // prevent Allow/Deny prompt
        firefoxProfile.setPreference('browser.dom.window.dump.enabled', true);

        firefoxProfile.encoded(function(encodedProfile) {
            var multiCapabilities = [{
                browserName: 'firefox',
                firefox_profile: encodedProfile
            }];
            resolve(multiCapabilities);
        });
    });

};