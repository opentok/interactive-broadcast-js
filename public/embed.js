/* eslint-disable */
var scripts = document.getElementsByTagName('script');
var parser = new URL(scripts[scripts.length - 1].src);
window.IBSApp = {
  defaultConfig: {
    container: 'body',
    userType: 'fan',
  },
  init: function(config) {
    /* Replace empty values with values by default */
    config = Object.assign({}, this.defaultConfig, config);

    /* Validate the adminId */
    if (!config.adminId) {
      console.error('Error: No adminId provided');
      return;
    }

    /* Validate the container */
    var container = document.querySelector(config.container);
    if (!container) {
      console.error('Error: The container is invalid');
      return;
    }

    /* Validate the width */
    if (!config.width) config.width = '600';
    if (isNaN(config.width)) {
      console.error('Error: The width is invalid');
      return;
    }

    /* Validate the height */
    if (!config.height) config.height = '400';
    if (isNaN(config.height)) {
      console.error('Error: The height is invalid');
      return;
    }

    /* Create the iframe element */
    var iframe = document.createElement('iframe');

    /* Set the iframe src */
    if (config.userType === 'fan') {
      iframe.src = [parser.origin, 'show', config.adminId].join('/');
    } else if (config.userType === 'celebrity' || config.userType === 'host') {
      iframe.src = [parser.origin, '/show-', config.userType, '/', config.adminId].join('');
    }

    if (!config.fitMode && config.fitMode === 'cover') {
      iframe.src += '?fitMode=cover';
    } 

    /* Set the rest of the iframe properties  */
    iframe.frameBorder = '0';
    iframe.width = config.width;
    iframe.height = config.height;
    iframe.scrolling = 'no';
    iframe.onload = function() {
      iframe.contentWindow.document.body.style.background = '#262626';
    }
    /* Append the iframe  */
    container.appendChild(iframe);
  },
};
