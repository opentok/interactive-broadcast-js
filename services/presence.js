/*eslint-env es6 */
'use strict';

/** Imports */
const url = require('url');
const Promise = require('bluebird');
const config = require('../libs/config');
const request = Promise.promisify(require('request'));

// Enable 'Async' methods (http://bluebirdjs.com/docs/api/promisification.html)
Promise.promisifyAll(request);

const ableToJoinInteractive = (fanUrl, admins_id, broadcastEnabled) => {

    return new Promise((resolve, reject) => {
        
        let options = {
            url: url.resolve(config.get('SIGNALING_SERVER_URL'), '/ableToJoinInteractive'),
            json: { 'fan_url': fanUrl,
                    'admins_id':admins_id, 
                    'broadcastEnabled': broadcastEnabled ? 'true' : 'false' }
        };
        request.postAsync(options)
            .then(response => {
                console.log('data from signaling', response.body);
                resolve(response.body);
            })
            .catch(error => {
                console.log('Could not retrieve ableToJoinInteractive', error);
                reject(error);
            });
    });
};


module.exports = {
    ableToJoinInteractive
};