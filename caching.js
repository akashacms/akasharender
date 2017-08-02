
'use strict';

const FlatCache = require('flat-cache');
var cache = FlatCache.load('akasharender');

exports.set = function(module, key, val) {
    return cache.setKey(`${module}-${key}`, val);
};

exports.get = function(module, key) {
    return cache.getKey(`${module}-${key}`);
};

exports.del = function(module, key) {
    return cache.removeKey(`${module}-${key}`);
};

exports.flushAll = function() {
    return cache.clearAll();
};


/*
const NodeCache = require( "node-cache" );
var AKCache = new NodeCache();

exports.set = function(module, key, val) {
    return undefined;
    // return AKCache.set(`${module}-${key}`, val);
};

exports.get = function(module, key) {
    return AKCache.get(`${module}-${key}`);
};

exports.mget = function(module, keyz) {
    return AKCache.mget(keyz.map(key => `${module}-${key}`));
};

exports.del = function(module, key) {
    return AKCache.del(`${module}-${key}`);
};

exports.mdel = function(module, key) {
    return AKCache.mdel(keyz.map(key => `${module}-${key}`));
};

exports.ttl = function(module, key, ttl) {
    return AKCache.ttl(`${module}-${key}`, ttl);
};

exports.getTtl = function(module, key) {
    return AKCache.getTtl(`${module}-${key}`);
};

exports.keys = function() {
    return AKCache.keys();
};

exports.getStats = function() {
    return AKCache.getStats();
};

exports.flushAll = function() {
    return AKCache.flushAll();
};

exports.close = function() {
    return AKCache.close();
};

exports.on = function(event, cb) {
    return AKCache.on(event, cb);
};
*/
