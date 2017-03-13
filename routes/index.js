var url = require('url');
var express = require('express');
var request = require('request');
var reactTools = require('react-tools');
var UglifyJS = require('uglify-js');
var redisClient = require('../services/redis');

var config = require('../libs/config');

var router = express.Router();
var presenceService = require('../services/presence');

var getClientIp = function(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

/* GET home page. */
router.get('/', function(req, res, next) {
  if(config.get('REDIRECT_TO')){
    res.redirect(config.get('REDIRECT_TO'));
  }else{
    res.redirect('./admin');
  }
});
router.post('/archiving-callback', function(req, res, next) {
    res.send('ok');
});
router.get('/login', function(req, res, next) {
  if(config.get('REDIRECT_TO')){
    res.redirect(config.get('REDIRECT_TO'));
  }else{
    res.render('login', { title: appName });
  }
});
router.get('/logout', function(req, res, next) {
    req.session.destroy();
    res.redirect('./login');
});

var fanView = function(req, res, broadcastEnabled, subscribeToAudio) {
    var fanUrl = req.params.fan_url;
    var getInLine = req.query.autogetinline;
    var admins_id = req.params.admins_id ? req.params.admins_id : null;
    var ua = req.useragent;
    var userHasCompatibleBrowser = !ua.isMobile && (ua.browser === 'Chrome' || ua.browser === 'Firefox');
    var usingSafari = !ua.isMobile && ua.browser === 'Safari';
    var interactiveStreamLimitEnabled = config.get('INTERACTIVE_STREAM_LIMIT') > 0;


    var renderInteractive = function(data) {
        res.render('fan_live_on', {
            title: appName,
            fan_url: req.params.fan_url,
            admins_id: admins_id,
            subscribe_audio: subscribeToAudio,
            embed: req.query.embed,
            session_id: (data) ? data.sessionId : "",
            event_name: (data) ? data.event_name : "",
            event_image: (data) ? data.event_image : "",
            broadcast_enabled: broadcastEnabled,
            signaling_url: config.get('SIGNALING_SERVER_URL')
        });
    }

    if ( !!getInLine || !interactiveStreamLimitEnabled || (!broadcastEnabled && usingSafari)) {
        renderInteractive();
    } else {
        presenceService.ableToJoinInteractive(fanUrl, admins_id, broadcastEnabled)
        .then(function(data) {
            if (data.ableToJoin && !usingSafari) {
                renderInteractive(data);
            } else {
                if(broadcastEnabled === true) {
                  res.render('broadcast', {
                      title: appName,
                      fan_url: req.params.fan_url,
                      embed: req.query.embed,
                      broadcast: data.broadcastData,
                      event_image: data.event_image,
                      signaling_url: config.get('SIGNALING_SERVER_URL')
                  })
                } else {
                  res.render('fan_live_error', {
                      title: appName,
                      event_name: data.event_name,
                      event_image: data.event_image,
                      embed: req.query.embed
                  });
                }
            }
        });
    }
};


// URL del fan
//@TODO: remove this route
router.get('/show/:fan_url', function(req, res, next) {
  fanView(req, res, false, true);
});

router.get('/show/:admins_id/:fan_url', function(req, res, next) {
  var admins_id = req.params.admins_id ? req.params.admins_id : null;
  redisClient.getAdminHLSConfig(admins_id, function(hlsEnabled) {
      fanView(req, res, hlsEnabled, true);
  });
});


// URL del fan
router.get('/post-production/:fan_url', function(req, res, next) {
  // TODO: check the event status before.
  res.render('fan_live_on', {
      title: 'Post Production',
      admins_id:null,
      fan_url: req.params.fan_url,
      subscribe_audio: false,
      embed: req.query.embed
  });
});

router.get('/post-production/:admins_id/:fan_url', function(req, res, next) {
  // TODO: check the event status before.

  var admins_id = req.params.admins_id ? req.params.admins_id : null;
  redisClient.getAdminHLSConfig(admins_id, function(hlsEnabled) {
      fanView(req, res, hlsEnabled, false);
  });
});



// URL del celebrity
router.get('/show-celebrity/:celebrity_url', function(req, res, next) {
  res.render('celebrity_host', { title: appName, celebrity_host_url: req.params.celebrity_url, box_id: 'celebrityBox'});
});

// URL del HOST
router.get('/show-host/:host_url', function(req, res, next) {
  // TODO: check the event status before.
  res.render('celebrity_host', { title: appName, celebrity_host_url: req.params.host_url, box_id: 'hostBox'});
});

router.post('/create_session', function(req, res, next) {
    var options = {
        uri: url.resolve(config.get('BACKEND_URL'), '/user/login'),
        method: 'POST',
        json: {
            'username': req.body.username,
            'password': req.body.password
        }
    };

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            req.session.user = body[0];
            if(req.session.user) {
              var hlsEnabled = req.session.user.hls_enabled || false;
              redisClient.saveAdminHLSConfig(req.session.user["userHash"], hlsEnabled);
            }

            res.json(body[0]); // Print the shortened url.
        }
    });
});

router.post('/create_service/', function(req, res, next) {
  var params = req.body;
  params.ip = getClientIp(req);

  if(req.body.adminId){
    params.admins_id = req.body.admins_id;
  }

  var options = {
      uri: url.resolve(config.get('BACKEND_URL'), '/create-token-fan'),
      method: 'POST',
      json: params
  };

  request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
          res.json(body);
      }
  });
});


router.get('/reenable-media', function(req, res, next) {
    res.render('reenable_media_instructions');
});

var embedUrls = ['/embed/(:host_celeb).js', '/embed.js'];
router.get(embedUrls, function(req, res, next) {
  var hashId = req.query.ssid;
  var adminId = req.query.userid;
  var hostCeleb = req.params.host_celeb;
  var immediate = req.query.immediate;
  var embed_css = req.query.embed_css;
  var width = req.query.width ? req.query.width: (config.get('INSTANCE_EMBED_WIDTH') || 650);
  var height = req.query.height ? req.query.height: (config.get('INSTANCE_EMBED_HEIGHT') || 400);
  var bkg_color = req.query.bkg_color;

  var data = {
    container: req.query.container,
    immediate: immediate && immediate === 'true' ? true : false,
    embed_css: embed_css && embed_css === 'no' ? '0' : '1',
    width: width,
    height: height,
    bkg_color: bkg_color
  };

  var renderWidgetCode = function (res, data) {
    data['eventUrl'] = ['https://', req.headers.host, '/show/', data['theUrl']].join('');

    // render this as javascript
    res.setHeader('content-type', 'text/javascript');
    res.render('embedable.ejs', data, function (err, jscode) {
      if (config.get('NODE_ENV') === 'development') {
        res.send(jscode);
      } else {
        // time to minify the code and uglify it :)
        var minifiedEmbed = UglifyJS.minify(jscode, {fromString: true});
        res.send(minifiedEmbed.code);
      }
    });
  };

  var renderMessage = function (res, data) {
    // render this as javascript
    res.setHeader('content-type', 'text/javascript');
    res.render('embed/widgetMessage.ejs', data);
  };

  var requestCallback  = function (error, response, body) {
    // check response content
    try {
      body = typeof(body) === "string" ? JSON.parse(body) : body;
    } catch(e) {
      console.log('Error:');
      console.log(e);
      body = [];
    }

    if (body.length > 0)
      body = body[0];
    else {
      data['message'] = 'There are no upcoming events.';
      return renderMessage(res, data);
    }

    if (!error && response.statusCode == 200) {
      if (typeof hostCeleb !== 'undefined') {
        if (hostCeleb === 'host')
          data['theUrl'] = 'host/' + body['host_url'];
        if (hostCeleb === 'celebrity')
          data['theUrl'] = 'celebrity/' + body['celebrity_url'];
      } else {
        data['theUrl'] = body['fan_url'];
      }

      return renderWidgetCode(res, data);
    } else {
      data['message'] = 'Wrong parameters';
      return renderMessage(res, data);
    }
  };

  var saveResults = function(error, response, body) {
    var tempBody = body;
    try {
      tempBody = typeof(tempBody) === "string" ? JSON.parse(tempBody) : tempBody;
    } catch(e) {
      tempBody = [];
    }
    if (!error && response.statusCode == 200 && tempBody.length > 0) {
      redisClient.saveCurrentEvent(adminId, body);
    }
    requestCallback(error, response, body);
  };

  var getCurrentAdminEvent = function() {
    var upcomingEventUrl = '/event/get-current-event';
    if (typeof adminId !== 'undefined') {
      upcomingEventUrl = '/event/get-current-admin-event-embed/' + adminId;
    }

    /*if(temp == null) {
      getCurrentAdminEvent();
    } else {
      requestCallback(null, {statusCode:200}, temp);
    }*/

    redisClient.getCurrentEvent(adminId, function(data){
      if(data) {
        console.log('Got it!', data);
        requestCallback(null, {statusCode:200}, data);
      } else {
        console.log('nothing...');
        request(url.resolve(config.get('BACKEND_URL'), upcomingEventUrl), saveResults);
      }
    });



  }

  if (typeof hashId === 'undefined') {
    getCurrentAdminEvent();
  } else {
    request.post(
      url.resolve(config.get('BACKEND_URL'), '/event/get-complete-session'),
      { json: { hash: hashId } },
      requestCallback
    );
  }

});


module.exports = router;
