'use strict';

module.exports.MockData = require('./MockData');
module.exports.TediousPromise = require('./TediousPromise');
module.exports.TediousPromises = require('./TediousPromises');
module.exports.TediousPromiseColumn = require('./TediousPromiseColumn');

var defaultInstance = new module.exports.TediousPromises();
module.exports.sql = defaultInstance.sql;
module.exports.setConnectionPool = defaultInstance.setConnectionPool;
module.exports.setConnectionConfig = defaultInstance.setConnectionConfig;
module.exports.setMockDataCallback = defaultInstance.setMockDataCallback;
module.exports.setDefaultColumnRenamer = defaultInstance.setDefaultColumnRenamer;
