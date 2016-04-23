'use strict';
var TediousPromise = require('./TediousPromise');
var _ = require('lodash');

function TediousPromises() {
  this._mode = null;
  this._option = null;
}

TediousPromises.prototype.setConnectionPool = function (connectionPool) {
  if (!connectionPool || !_.isFunction(connectionPool.acquire)) {
    throw new Error('Connection pool parameter required.');
  }

  if (this._connectionConfig) {
    throw new Error('Cannot set both the connection pool and individual connection configuration.');
  }

  this._mode = 'pool';
  this._option = connectionPool;
  return this;
};

TediousPromises.prototype.setConnectionConfig = function (connectionConfig) {
  if (!connectionConfig || !_.isString(connectionConfig.userName)) {
    throw new Error('Connection configuration parameter required.');
  }

  if (this._connectionPool) {
    throw new Error('Cannot set both the connection pool and individual connection configuration.');
  }

  this._mode = 'single';
  this._option = connectionConfig;
  return this;
};

// A mock function to be called instead of an actual database call.
// function(sql, outputParameters) { }
//   sql: SQL that would have been executed
//   outputPatamters: SQL parameter dictionary
//   returns: the resulting collection of objects whose properties are named after the database columns
TediousPromises.prototype.setMockDataCallback = function (callback) {
  if (!_.isFunction(callback)) {
    throw 'Argument must be a function.';
  }

  this._mode = 'mock';
  this._option = callback;
  return this;
};

TediousPromises.prototype.setDefaultColumnRenamer = function (renameFunction) {
  if (!_.isFunction(renameFunction)) {
    throw 'Argument must be a function.';
  }

  this._renameFunction = renameFunction;
  return this;
};

TediousPromises.prototype.sql = function (sql) {
  if (!this._mode || !this._option) {
    throw new Error('Must set the Connection Pool, Connection Config, or Mock Callback first.');
  }

  var tp = new TediousPromise(this._mode, this._option);

  if (_.isFunction(this._renameFunction)) {
    tp.defaultColumnRenamer = this._renameFunction;
  }

  return tp.sql(sql);
};

TediousPromises.prototype.beginTransaction = function () {
  if (!this._mode || !this._option) {
    throw new Error('Must set the Connection Pool, Connection Config, or Mock Callback first.');
  }

  var tp = new TediousPromise(this._mode, this._option);

  if (_.isFunction(this._renameFunction)) {
    tp.defaultColumnRenamer = this._renameFunction;
  }

  return tp.beginTransaction();
};

TediousPromises.prototype.rollbackTransaction = function () {
  if (!this._mode || !this._option) {
    throw new Error('Must set the Ponnection Pool, Connection Config, or Mock Callback first.');
  }

  var tp = new TediousPromise(this._mode, this._option);

  if (_.isFunction(this._renameFunction)) {
    tp.defaultColumnRenamer = this._renameFunction;
  }

  return tp.rollbackTransaction();
};

TediousPromises.prototype.saveTransaction = function () {
  if (!this._mode || !this._option) {
    throw new Error('Must set the Ponnection Pool, Connection Config, or Mock Callback first.');
  }

  var tp = new TediousPromise(this._mode, this._option);

  if (_.isFunction(this._renameFunction)) {
    tp.defaultColumnRenamer = this._renameFunction;
  }

  return tp.saveTransaction();
};

TediousPromises.prototype.commitTransaction = function () {
  if (!this._mode || !this._option) {
    throw new Error('Must set the Ponnection Pool, Connection Config, or Mock Callback first.');
  }

  var tp = new TediousPromise(this._mode, this._option);

  if (_.isFunction(this._renameFunction)) {
    tp.defaultColumnRenamer = this._renameFunction;
  }

  return tp.commitTransaction();
};

module.exports = TediousPromises;
