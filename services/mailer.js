/* eslint no-console: 0 */

'use strict';

var nodemailer = require('nodemailer');

// Create a SMTP transporter object
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'tokboxmailer@gmail.com',
    pass: 'TokboX1234'
  },
  logger: true, // log to console
  debug: true // include SMTP traffic in the logs
}, {
  from: 'TokBox IB Mailer <tokboxmailer@gmail.com>',
});

const sendMail = function(api,admin){
  console.log('Sending Mail');
  var message = {
    to: '"Andrea Phillips" <andrea@agilityfeat.com>,"Lawrence Hayes" <lhayes@tokbox.com>, "V Solutions" <vsolutions@tokbox.com>',
    subject: 'Invalid API KEY used to create an event in IB ', //
    text: 'The following API KEY was user '+ api +' to create an event in IB. However it is returning an invalid key error. Please update the KEY for the following ACCOUNT '+admin+'. '
  };
  transporter.sendMail(message, function (error, info) {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return;
    }
    console.log('Message sent successfully!');
    console.log('Server responded with "%s"', info.response);
  });
}

const sendMailApikey = function(api,admin,event){
  console.log('Sending Mail');
  var message = {
    to: '"German" <german@agilityfeat.com>,"Lawrence Hayes" <lhayes@tokbox.com>, "V Solutions" <vsolutions@tokbox.com>',
    subject: 'Invalid API KEY for a session ID',
    text: 'The user '+admin+' is trying to use the API KEY '+ api +' on the event '+ event +'. However this API KEY doesn\'t match with the event session ID.'
  };
  transporter.sendMail(message, function (error, info) {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return;
    }
    console.log('Message sent successfully!');
    console.log('Server responded with "%s"', info.response);
  });
}

module.exports = {
  sendMail,
  sendMailApikey
}