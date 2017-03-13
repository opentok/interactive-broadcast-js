require('newrelic');
GLOBAL.package  = require('./package.json');
GLOBAL.appName  = package.appName;

GLOBAL.userIsSuperAdmin = function(req, res, next){
  if(req.session.user){
    if (req.session.user.is_superadmin) {
      next();
    } else {
      res.redirect("/");
    }
  } else {
    res.redirect("/");
    //req.status(401).json({message:"Session expired", status : 401});
  }
}
GLOBAL.userIsLoggedIn = function(req, res, next){
  if(req.session.user){
    if (req.session.user.set_password) {
      next();
    } else {
      res.redirect("/admin/set-password");
    }
  } else {
    res.redirect("/login");
    //req.status(401).json({message:"Session expired", status : 401});
  }
}
GLOBAL.userNeedsNewPassword = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}



GLOBAL.AWS = require('aws-sdk');
var useragent = require('express-useragent');
var sslRedirect = require('heroku-ssl-redirect');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessions = require('./sessions');
var app = express();
var https = require('https');
var fs = require('fs');
var compress = require('compression');
app.use(useragent.express());
app.use(compress());

app.use(sslRedirect(['production'], 301));

var config = require('./libs/config');
var routes = require('./routes/index');
var admin = require('./routes/admin');
var host = require('./routes/host');
var celebrity = require('./routes/celebrity');

var server = require('http').Server(app);


GLOBAL.streamOptions = require('./libs/streamOptions')();

var generateUID = function(separator) {
    var delim = separator || '-';

    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};

// update aws config vars
AWS.config.update({
    accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY')
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Serve static assets

app.set('js', app.get('env') === 'production' ? 'min' : 'dev');

app.use(function(req, res, next) {
    if (req.url === '/javascripts/bundle.js') {
        req.url = '/javascripts/bundle.' + app.get('js') + '.js';
    }

    next();
});


app.use(sessions());

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/admin', admin);
app.use('/host', host);
app.use('/celebrity', celebrity);
app.use('/s3', require('react-s3-uploader/s3router')({
    bucket: config.get('S3_BUCKET_NAME_IMAGES'),
    getFileKeyDir: function() {
        return 'img';
    }
}));

//header for admin functions to prevent framing attacks
app.use('/admin', function(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title: appName,
            message: err.message,
            error: err,
            debug: true
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
res.status(err.status || 500);
  console.log(err)
  res.render('error', {
    title: appName,
    message: err.message,
    error: {},
    debug: false
  });
});

if (app.get('env') === 'development') {
    server = https.createServer({
        key: fs.readFileSync('./server.key', 'utf8'),
        cert: fs.readFileSync('./server.crt', 'utf8')
    }, app);
}

httpServer = server.listen(config.get('PORT'), function() {
    console.log(appName + " app is running at localhost:" + config.get('PORT'));
});

// app.set('io', io);

module.exports = app;