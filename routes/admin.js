var url = require('url');
var extend = require('util')._extend;
var express = require('express');
var request = require('request');
var config = require('../libs/config');
var redisClient = require('../services/redis');
var mailer = require('../services/mailer');
var router = express.Router();

/* GET home page. this is the dashboard */
router.get('/', userIsLoggedIn, function (req, res, next) {

  var message = null;
  if(req.query.event_added){
    message = "Event was successfully added"
  }
  if(req.query.event_edited){
    message = "Event was successfully edited"
  }
  res.render('./admin/admin_dashboard', {
    title: appName,
    user: req.session.user,
    notification: message,
    serverUrl: config.get('FRONTEND_URL'),
    signalingServerUrl: config.get('SIGNALING_SERVER_URL')
  });
});


router.get('/events/new', userIsLoggedIn, function (req, res, next) {
  res.render('./admin/new_event', {
    title: appName,
    user_id: req.session.user["id"],
    user: req.session.user,
    admins_hash:req.session.user["userHash"],
    postproductionurl_enabled: config.get('POSTPRODUCTION_ENABLED'),
    instance_enable_archiving: config.get('INSTANCE_ENABLE_ARCHIVING')
  });
});


router.get('/events/:eventId', userIsLoggedIn, function (req, res, next) {
  var eventId = req.params.eventId;
  var customStreamOptions = extend(streamOptions, {
    'width': "100%",
    'height': "100%"
  });



  res.render('./admin/show', {
    title: appName,
    user: req.session.user,
    eventId: eventId,
    interactive_limit: config.get('INTERACTIVE_STREAM_LIMIT'),
    postproductionurl_enabled: config.get('POSTPRODUCTION_ENABLED'),
    streamOptions: JSON.stringify(customStreamOptions),
    signaling_url: config.get('SIGNALING_SERVER_URL')
  });

});


router.get('/events/:eventId/edit', userIsLoggedIn, function (req, res, next) {
  var eventId = req.params.eventId;

  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/get'),
    method: 'POST',
    json: {
      'id': eventId
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.length == 1) {
        res.render('admin/event_edit', {
          title: appName,
          user: req.session.user,
          event: body[0],
          postproductionurl_enabled: config.get('POSTPRODUCTION_ENABLED'),
          instance_enable_archiving: config.get('INSTANCE_ENABLE_ARCHIVING')
        });
      }
    }
  });
});


router.get('/events/:eventId/view', userIsLoggedIn, function (req, res, next) {
  // TODO: check the event status before rendering
  var eventId = req.params.eventId;
  var eventData = {};
  var archiveReady = false;

  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/get'),
    method: 'POST',
    json: {
      'id': eventId
    }
  };

  // this is to avoid writing same code twice
  var renderResponse = function () {
    res.render('admin/event_view', {
      title: appName,
      user: req.session.user,
      event: eventData
    });
  };

  // to avoid writing same code twice
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.length == 1) {
        eventData = body[0];
        if (eventData.archive_id && eventData.composed) {
          var videoFile = [req.session.user.ot_apikey,'/', eventData.archive_id, '/archive.mp4'].join('');
          eventData.archive_url = url.resolve(config.get('S3_COMPOSEDVIDEO_URL'), videoFile);
          renderResponse();
        }
      }
    }
  });
});

router.get('/events/:eventId/download', userIsLoggedIn, function (req, res, next) {
  // TODO: check the event status before rendering
  var eventId = req.params.eventId;
  var eventData = {};
  var archiveReady = false;

  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/get'),
    method: 'POST',
    json: {
      'id': eventId
    }
  };

  // to avoid writing same code twice
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.length == 1) {
        eventData = body[0];
        if (eventData.archive_id) {
          var archiveFile = [req.session.user.ot_apikey, '/', eventData.archive_id, '/', 'archive.zip'].join('');
          var zipUrl = url.resolve(config.get('S3_COMPOSEDVIDEO_URL'), archiveFile);
          res.redirect(zipUrl);
        }
      }
    }
  });
});


router.get('/archive/start/:sessionId/:eventId/:composed', function (req, res) {
  var sessionId = req.params.sessionId;
  var eventId = req.params.eventId;
  var composed = req.params.composed;
  var output = composed == "false" ? "individual" : "composed" ;
  var archiveDate = new Date().toISOString().slice(0, 10);

  console.log("Starting Archive with output "+ output);

  var options = {
      uri: url.resolve(config.get('BACKEND_URL'), '/event/start-archive'),
      method: 'POST',
      json: {
        "name": ['Archive', req.query.eventName, new Date().toISOString().slice(0, 10)].join(' '),
        "session_id": sessionId,
        "events_id": eventId,
        "output_mode": output,
        "ot": {ot_apikey: req.session.user["ot_apikey"],
               ot_secret: req.session.user["ot_secret"]}

      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("Archive id saved");
        res.json(body);
      } else {
        var msg = 'Unable to start archive for session ' + sessionId;
        return res.send(500, msg);
      }
   });
});


router.get('/archive/stop/:archiveId', function (req, res) {
  var archiveId = req.params.archiveId;
  var options = {
      uri: url.resolve(config.get('BACKEND_URL'), '/event/stop-archive'),
      method: 'POST',
      json: {
        "archive_id": archiveId,
        "admins_id": req.session.user["id"],
        "ot": {ot_apikey: req.session.user["ot_apikey"],
               ot_secret: req.session.user["ot_secret"]}
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("Archive id saved");
        res.send(200);
      } else {
        var msg = 'Unable to start archive for session';
        return res.send(500, msg);
      }
    });
});

router.get('/create_service/:eventId', function (req, res, next) {
  var eventId = req.params.eventId;
  request(url.resolve(config.get('BACKEND_URL'), '/create-token-producer/' + eventId), function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.json(body);
    }
  });
});


router.post('/send_apikey_error', function (req, res, next) {
  var params = req.body;
  mailer.sendMailApikey(req.session.user["ot_apikey"],req.session.user.name, params.event);
  res.send(200);
});

router.post('/create_event', function (req, res, next) {
  var params = req.body;
  params.admins_name = req.session.user.name;
  params.ot = {ot_apikey: req.session.user["ot_apikey"],
               ot_secret: req.session.user["ot_secret"]};
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/create'),
    method: 'POST',
    json: params
  };
  console.log(options);
  request(options, function (error, response, body) {
    if (!error && !body.error && response.statusCode == 200) {
      console.log(body);
      res.json(body); // Print the shortened url.
    } else {
      if(body.error == 'Invalid APIKEY OR SECRET'){
        mailer.sendMail(req.session.user["ot_apikey"],params.admins_name);
      }
      res.json({"success":false,"error":body.error});
    }
  });
});


router.post('/update_event', function (req, res, next) {
  var params = req.body;
  params.admins_name = req.session.user.name;
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/update'),
    method: 'POST',
    json: params
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.json(body);
    } else {
      mailer.sendMail(req.session.user["ot_apikey"],params.admins_name);
      res.json({"success":false,"error":error});
    }
  });
});

router.post('/event_get', function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/get'),
    method: 'POST',
    json: {
      'id': req.body['id']
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.length == 1) {
        body[0].signaling_url = config.get('SIGNALING_SERVER_URL');
        console.log(body);
        res.json(body);
      }
    }
  });
});

router.get('/metrics/:event_id',userIsLoggedIn, function(req, res, next) {

  var eventId = req.params.event_id;

  res.render('./admin/metrics', {
    user: req.session.user,
    title: appName,
    eventId: eventId,
  });
});

router.get('/metrics-by-event/:event_id', function(req, res, next) {

  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/metrics/get-by-event'),
    method: 'POST',
    json: {
      "event_id":req.params.event_id
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      res.json(body);
    }
  });
});

router.get('/get-my-events', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/get-admin-events'),
    method: 'POST',
    json: {
      'admins_id': parseInt(req.session.user['id'])
    }
  };

  request(options, function (error, response, body) {
    if (!error) {
      res.json(body);
    }
  });
});

router.post('/change-event-status', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/change-status'),
    method: 'POST',
    json: {
      "id": req.body.id,
      "status": req.body.newStatus,
      "ot_apikey": req.session.user.ot_apikey,
      "ot_secret": req.session.user.ot_secret,
    }
  };
  console.log(options);
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //Remove the current event for this admin from redis
      if(req.body.newStatus === 'C') redisClient.removeCurrentEvent(req.session.user.userHash);
      res.json(body); // Print the shortened url.
    }
  });
});

router.post('/event-delete', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/event/delete'),
    method: 'POST',
    json: {
      "id": req.body.id
    }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //Remove the current event for this admin from redis
      redisClient.removeCurrentEvent(req.session.user.userHash);
      res.json(body);// Print the shortened url.
    }
  });
});

router.get('/set-password', userNeedsNewPassword, function (req, res, next) {

  res.render('./admin/set_password', {
    title: appName
  });

});

router.post('/change-password', userNeedsNewPassword, function (req, res, next) {

  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/user/set-password'),
    method: 'POST',
    json: {
      "old_password": req.body.old_password,
      "new_password": req.body.new_password,
      "new_password_confirm": req.body.new_password_confirm,
      "id": req.session.user.userHash
    }
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      var bodyResponse = typeof(body) == 'string' ? JSON.parse(body) : body;
      if (bodyResponse.success) {
        req.session.user.set_password = true;
      }
      res.json(body);
    }
  });

});
////USERS


router.get('/get-all-users', userIsSuperAdmin, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/admin/get'),
    method: 'POST'
  };

  request(options, function (error, response, body) {
    if (!error) {
      console.log(body);
      res.json(body);
    }
  });
});

router.get('/users', userIsSuperAdmin, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/admin/get'),
    method: 'POST'
  };

  request(options, function (error, response, body) {
    if (!error) {
      console.log(body);
      //res.json(body);
      res.render('./admin/user_list', {
        user: req.session.user,
        title: appName,
      });
    }
  });
});

router.post('/user-delete', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/admin/delete'),
    method: 'POST',
    json: {
      "id": req.body.id
    }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.json(body);// Print the shortened url.
    }
  });
});

router.post('/user-create', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/admin/create'),
    method: 'POST',
    json: {
      "username": req.body.username,
      "name": req.body.name,
      "password": req.body.password,
      "ot_apikey": req.body.ot_apikey,
      "ot_secret": req.body.ot_secret,
      "hls_enabled": JSON.parse(req.body.hls_enabled),
      "http_support": JSON.parse(req.body.http_support)
    }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body) {
        console.log(body);
        redisClient.saveAdminHLSConfig(body.userHash, JSON.parse(req.body.hls_enabled));
      }
      res.json(body);// Print the shortened url.
    }
  });
});

router.post('/user-edit', userIsLoggedIn, function (req, res, next) {
  var options = {
    uri: url.resolve(config.get('BACKEND_URL'), '/admin/update'),
    method: 'POST',
    json: {
      "username": req.body.username,
      "name": req.body.name,
      "password": req.body.password,
      "id":req.body.id,
      "ot_apikey": req.body.ot_apikey,
      "ot_secret": req.body.ot_secret,
      "hls_enabled": JSON.parse(req.body.hls_enabled),
      "http_support": JSON.parse(req.body.http_support),
    }
  };
  console.log(options);
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if(body.success) {
        console.log(body);
        redisClient.saveAdminHLSConfig(body.userHash, JSON.parse(req.body.hls_enabled));
      }
      res.json(body);// Print the shortened url.
    }
  });
});

module.exports = router;
