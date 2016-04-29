'use strict';
var chalk = require('chalk');
var q = require('q');
var _ = require('lodash');
var dbConfig = require('./database/config.json');
var tediousPromises = require('../src');
var TediousPromises = tediousPromises.TediousPromises;
var ConnectionPool = require('tedious-connection-pool');

// This will give failing unit tests better stack traces if they use promises
q.longStackSupport = true;

// Compensate for internet latency
jasmine.getEnv().defaultTimeoutInterval = 20000;

module.exports.getDatabaseConfig = getDatabaseConfig;
module.exports.init = init;
module.exports.initWithPool = initWithPool;
module.exports.initWithoutPool = initWithoutPool;
module.exports.selectColumn = selectColumn;

function init(test) {
  console.log('Begin test: ' +
    chalk.magenta(test.suite.getFullName()) + ' ' +
    chalk.cyan(test.description));

}

function initWithPool(test) {
  init(test);

  var poolConfig = {
    min: 4,
    max: 4,
    log: true,
  };

  var pool = new ConnectionPool(poolConfig, getDatabaseConfig());
  var tp = new TediousPromises()
    .setConnectionPool(pool);

  return {
    pool: pool,
    tp: tp,
  };
}

function initWithoutPool(test) {
  init(test);

  return new TediousPromises()
    .setConnectionConfig(getDatabaseConfig());
}

function getDatabaseConfig() {
  return _.cloneDeep(dbConfig);
}

// for easy slicing of the data in the table files
function selectColumn(data, column) {
  return data.map(function (x) {
    var val = {};
    val[column] = x[column];
    return val;
  });
}
