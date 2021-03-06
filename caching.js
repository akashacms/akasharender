/**
 *
 * Copyright 2014-2019 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';

const FlatCache = require('flat-cache');
const cache = FlatCache.load('akasharender');

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

/**
 * This second cache is for persisting data to a given directory
 */

var persistentCache;

exports.persistenceDir = function(dir) {
    if (persistentCache) return;
    persistentCache = FlatCache.load('akasharender-persistent', dir);
};

exports.persist = function(module, key, val) {
    return !persistentCache
        ? exports.set(module, key, val)
        : persistentCache.setKey(`${module}-${key}`, val);
};

exports.retrieve = function(module, key, val) {
    return !persistentCache
        ? exports.get(module, key)
        : persistentCache.getKey(`${module}-${key}`);
};

exports.forget = function(module, key, val) {
    return !persistentCache
        ? exports.del(module, key)
        : persistentCache.removeKey(`${module}-${key}`);
};

exports.flushPersistence = function() {
    return !persistentCache
        ? exports.flushAll()
        : persistentCache.clearAll();
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
