'use strict';

module.exports.MockData = require('./MockData');
module.exports.TediousPromise = require('./TediousPromise');
module.exports.TediousPromises = require('./TediousPromises');
module.exports.TediousPromiseColumn = require('./TediousPromiseColumn');
module.exports.MockTediousConnection = require('./MockTediousConnection');

var defaultInstance = new module.exports.TediousPromises();
module.exports.sql = defaultInstance.sql.bind(defaultInstance);
module.exports.beginTransaction = defaultInstance.beginTransaction.bind(defaultInstance);
module.exports.commitTransaction = defaultInstance.commitTransaction.bind(defaultInstance);
module.exports.saveTransaction = defaultInstance.saveTransaction.bind(defaultInstance);
module.exports.rollbackTransaction = defaultInstance.rollbackTransaction.bind(defaultInstance);
module.exports.setConnectionPool = defaultInstance.setConnectionPool.bind(defaultInstance);
module.exports.setConnectionConfig = defaultInstance.setConnectionConfig.bind(defaultInstance);
module.exports.setMockDataCallback = defaultInstance.setMockDataCallback.bind(defaultInstance);
module.exports.setDefaultColumnRenamer = defaultInstance.setDefaultColumnRenamer.bind(defaultInstance);
module.exports.setPromiseLibrary = defaultInstance.setPromiseLibrary.bind(defaultInstance);
