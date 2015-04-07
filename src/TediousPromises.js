'use strict';
var TediousPromise = require('./TediousPromise');
var _ = require('lodash');


function TediousPromises() {
  this._connectionPool = null;
  this._connectionConfig = null;
}

TediousPromises.prototype.setConnectionPool = function(connectionPool) {
  if(!connectionPool || !_.isFunction(connectionPool.acquire)) {
    throw new Error('Connection pool parameter required.');
  }

  if(this._connectionConfig) {
    throw new Error('Cannot set both the connection pool and individual connection configuration.');
  }

  this._connectionPool = connectionPool;
  return this;
};

TediousPromises.prototype.setConnectionConfig = function(connectionConfig) {
  if(!connectionConfig || !_.isString(connectionConfig.userName)) {
    throw new Error('Connection configuration parameter required.');
  }

  if(this._connectionPool) {
    throw new Error('Cannot set both the connection pool and individual connection configuration.');
  }

  this._connectionConfig = connectionConfig;
  return this;
};

TediousPromises.prototype.sql = function(sql) {
  var tdp;
  if(this._connectionPool) {
    tdp = new TediousPromise(this._connectionPool);
  } else if(this._connectionConfig) {
    tdp = new TediousPromise(this._connectionConfig);
  } else {
    throw new Error('Must set either the connection pool or connection config first.');
  }

  return tdp.sql(sql);
};

module.exports = TediousPromises;
