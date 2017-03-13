var url = require('url');
var express = require('express');
var request = require('request');
var reactTools = require('react-tools');
var UglifyJS = require('uglify-js');

var config = require('../libs/config');

var router = express.Router();


/* GET home page. */
router.get('/create_service/:host_url', function(req, res, next) {

  var host_url = req.params.host_url;
  request(url.resolve(config.get('BACKEND_URL'), '/create-token-host/'+host_url), function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.json(body);
    }
  });

});





module.exports = router;
