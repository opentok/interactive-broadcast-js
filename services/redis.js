/*eslint-env es6 */
'use strict';

/** Imports */
const Promise = require('bluebird');
const config = require('../libs/config');
const redis = require('redis');
const client = redis.createClient(config.get('REDISCLOUD_URL') || config.get('REDIS_URL'));

// Enable 'Async' methods (http://bluebirdjs.com/docs/api/promisification.html)
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);


const saveAdminHLSConfig = (admins_id, data) => {
    client.set(admins_id, data);
};

const getAdminHLSConfig = (admins_id, cb) => {

    client.get(admins_id, function(err, reply){
        cb((reply === 'true' || reply === true) ? true : false);
    });
    
};

const saveCurrentEvent = (admins_id, data) => {
	client.set('current-event-'+admins_id, data);
};

const getCurrentEvent = (admins_id, cb) => {
    client.get('current-event-'+admins_id, function(err, reply){
    	cb(reply);
    });
};

const removeCurrentEvent = (admins_id) => {
	client.del('current-event-'+admins_id);
};


module.exports = {
    saveAdminHLSConfig,
    getAdminHLSConfig,
    saveCurrentEvent,
    getCurrentEvent,
    removeCurrentEvent
};