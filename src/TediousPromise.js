'use strict';
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TediousPromiseColumn = require('./TediousPromiseColumn');
var MockTediousConnection = require('./MockTediousConnection');
var PromiseUtil = require('./PromiseUtil');
var _ = require('lodash');

function TediousPromise(mode, option) {
  // TODO: Transaction support - Accept an open transaction on the constructor

  if (mode === 'pool' && _.isObject(option) && _.isFunction(option.acquire)) {
    this._connectionPool = option;

  } else if (mode === 'single' && _.isObject(option)) {
    this._connectionConfig = option;

  } else if (mode === 'mock' && _.isFunction(option)) {
    this._mockDataCallback = option;

  } else {
    throw 'Invalid arguments.  Mode must be "pool", "single", or "mock"; with an "option" of the correct type.';
  }

  this._mode = mode;
  this._sql = null;
  this._columns = {};
  this._parameters = {};
  this._outputParameters = {};
  this._forEachRow = null;
  this._returnRowCount = false;
  this._transformRow = this.transformers.rowToObject;
  this._promiseLibrary = PromiseUtil.getNamedLibrary('q');

  // Should only be set when the last function called created a column
  // Must reset to null on other functions
  this._lastColumn = null;

  // function to rename columns if the name wasn't manually overriden
  // i.e.:  _.camelCase
  this.defaultColumnRenamer = null;
}

function enableDebugLogging(connection) {
  // console.log('Enable debug logging');
  // connection.on('infoMessage', function(info) { console.log('INFOM: ', info); });
  // connection.on('errorMessage', function(info) { console.log('ERRORM: ', info); });
  // connection.on('error', function(info) { console.log('ERROR: ', info); });
  // connection.on('debug', function(info) { console.log('DEBUG: ', info); });
  // connection.on('end', function() { console.log('END'); });
}

TediousPromise.prototype.setPromiseLibrary = function (libraryOrName) {
  // TediousPromises class will bypass this function and set _promiseLibrary directly
  //   so we don't need to repeatedly re-validate the library.
  this._promiseLibrary = PromiseUtil.getOrValidateLibrary(libraryOrName);
};

TediousPromise.prototype.beginTransaction = function () {
    return this._createConnection()
        .then(function (connection) {
            var deferred = this._promiseLibrary.defer();
            this._connection = connection;
            connection.beginTransaction(function (err) {
                this._transaction = true;
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(this);
                }
              }.bind(this));
            return deferred.promise;
          }.bind(this));
  };

TediousPromise.prototype.commitTransaction = function () {
    var deferred = this._promiseLibrary.defer();
    this._connection.commitTransaction(function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          this._transaction = false;
          this._disposeConnection(this._connection);
          deferred.resolve();
        }
      }.bind(this));
    return deferred.promise;
  };

TediousPromise.prototype.saveTransaction = function () {
    var deferred = this._promiseLibrary.defer();
    this._connection.saveTransaction(function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      }.bind(this));
    return deferred.promise;
  };

TediousPromise.prototype.rollbackTransaction = function () {
    var deferred = this._promiseLibrary.defer();
    this._connection.rollbackTransaction(function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          this._transaction = false;
          this._disposeConnection(this._connection);
          deferred.resolve();
        }
      }.bind(this));
    return deferred.promise;
  };

TediousPromise.prototype._createConnection = function () {
  // TODO: Transaction support - if transaction, resolve with transaction's connection
  var deferred = this._promiseLibrary.defer();

  if (this._connection) { // existing connection found
    deferred.resolve(this._connection);
  } else {
    if (this._mode === 'mock') {
      return this._promiseLibrary.resolve(new MockTediousConnection(this));

    } else if (this._mode === 'pool') {
      // get from pool
      this._connectionPool.acquire(function (err, connection) {
        try {
          if (err) {
            if (connection) {
              connection.release();
            }

            deferred.reject(err);
          } else {
            enableDebugLogging(connection);
            deferred.resolve(connection);
          }
        } catch (e) {
          deferred.reject(e);
        }
      });

    } else if (this._mode === 'single') {
      // create new connection
      var connection = new Connection(this._connectionConfig);

      connection.on('connect', function (err) {
        try {
          if (err) {
            connection.close();
            deferred.reject(err);
          } else {
            enableDebugLogging(connection);
            deferred.resolve(connection);
          }
        } catch (e) {
          deferred.reject(e);
        }
      });

    } else {
      throw new Error('Create connection not implemented for mode: ' + this._mode + '.');
    }
  }

  return deferred.promise;
};

TediousPromise.prototype._disposeConnection = function (connection) {
  // TODO: Transaction support - if transaction, do nothing

  if (this._mode === 'mock') {
    return; // nothing to do for the mock

  } else if (this._mode === 'pool') {
    if (_.isFunction(connection.release)) {
      // release from connection pool
      connection.release();
    }

  } else if (this._mode === 'single') {
    connection.close();

  } else {
    throw new Error('Dispose connection not implemented for mode: ' + this._mode + '.');
  }

};

TediousPromise.prototype._handleOutputParameter = function (parameterName, value, metadata) {
  if (this._outputParameters.hasOwnProperty(parameterName) && _.isFunction(this._outputParameters[parameterName].callback)) {
    this._outputParameters[parameterName].callback(value, metadata);
  }
};

TediousPromise.prototype._getColumnMap = function (colName) {
  var map = this._columns[colName];

  if (!map) {

    // create default mapping if needed
    if (_.isFunction(this.defaultColumnRenamer)) {
      map = new TediousPromiseColumn(colName, this.defaultColumnRenamer(colName));
    } else {
      map = new TediousPromiseColumn(colName);
    }

    this._columns[colName] = map;
  }

  return map;
};

TediousPromise.prototype.transformers = {
  rowToObject: function (row, getColumnMap) {
    var result = {};

    for (var i = 0; i < row.length; i++) {
      var col = row[i];
      var map = getColumnMap(col.metadata.colName);

      map._applyMapping(col, result);
    }

    return result;
  },

  rowToArray: function (row, getColumnMap) {
    var result = [];

    for (var i = 0; i < row.length; i++) {
      var col = row[i];
      var map = getColumnMap(col.metadata.colName);

      result.push(map.GetColumnValue(col));
    }

    return result;
  },
};

TediousPromise.prototype._executeRequest = function (connection, fnName) {
  var deferred = this._promiseLibrary.defer();
  var results = [];

  var request = new Request(this._sql, function (error, rowCount) {
    try {
      if (!this._transaction) {
        this._disposeConnection(connection);
      } else {
        this._sql = null;
      }

      if (error) {
        deferred.reject(error);
        return;
      } else {

        if (this._forEachRow || this._returnRowCount) {
          deferred.resolve(rowCount);
        } else {
          deferred.resolve(results);
        }
      }
    } catch (e) {
      deferred.reject(e);
    }
  }.bind(this));

  request.on('row', function (row) {
    try {
      // need to re-bind getColumnMap, since it's passed as a parameter
      var result = this._transformRow(row, this._getColumnMap.bind(this));

      if (this._forEachRow) {
        this._forEachRow(result);
      } else {
        results.push(result);
      }
    } catch (e) {
      deferred.reject(e);
    }
  }.bind(this));

  request.on('returnValue', function (parameterName, value, metadata) {
    try {
      this._handleOutputParameter(parameterName, value, metadata);
    } catch (e) {
      deferred.reject(e);
    }
  }.bind(this));

  _.forEach(this._parameters, function (p) {
    request.addParameter(p.name, p.type, p.value, p.options);
  });

  _.forEach(this._outputParameters, function (p) {
    request.addOutputParameter(p.name, p.type, p.value, p.options);
  });

  if (fnName === 'callProcedure') {
    connection.callProcedure(request);
  } else {
    connection.execSql(request);
  }

  return deferred.promise;
};

TediousPromise.prototype.rowTransformer = function (transformer) {
  if (_.isFunction(transformer)) {
    this._transformRow = transformer;
  } else if (_.isString(transformer)) {
    this._transformRow = this.transformers[transformer];

    if (!this._transformRow) {
      throw new Error('Row transformer "' + transformer + '" not defined.');
    }
  } else {
    throw new Error('Thr row transformer must either be a function or a string.');
  }

  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.returnRowCount = function () {
  this._returnRowCount = true;
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.sql = function (sql) {
  if (this._sql) {
    throw new Error('SQL already set.');
  }

  if (typeof sql !== 'string') {
    throw new Error('SQL must be a string, received ' + (typeof sql) + '.');
  }

  this._sql = sql;
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.column = function (name, mapping) {
  var map;

  if (mapping instanceof TediousPromiseColumn) {
    map = mapping;

  } else if (typeof mapping === 'undefined' && _.isFunction(this.defaultColumnRenamer)) {
    map = new TediousPromiseColumn(name, this.defaultColumnRenamer(name));

  } else if (typeof mapping === 'undefined' || typeof mapping === 'string') {
    map = new TediousPromiseColumn(name, mapping);

  } else {
    throw new Error('Unexpected collumn mapping type: ' + (typeof mapping) + '.');
  }

  this._columns[name] = map;
  this._lastColumn = map;
  return this;
};

TediousPromise.prototype.parameter = function (name, type, value, options) {
  this._parameters[name] = {
    name: name,
    type: type,
    value: value,
    options: options,
  };
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.outputParameter = function (name, type, value, options, callback) {
  if (_.isFunction(value) && typeof options === 'undefined' && typeof callback === 'undefined') {
    // (name, type, callback)
    this._outputParameters[name] = {
      name: name,
      type: type,
      callback: value,
    };
  } else {
    // (name, type, value, options, callback)
    this._outputParameters[name] = {
      name: name,
      type: type,
      value: value,
      options: options,
      callback: callback,
    };
  }

  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.forEachRow = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function.');
  }

  this._forEachRow = callback;
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.execute = function () {
  this._lastColumn = null;

  return this._createConnection()
  .then(function (connection) {
    return this._executeRequest(connection);
  }.bind(this));
};

TediousPromise.prototype.callProcedure = function () {
  this._lastColumn = null;

  return this._createConnection()
  .then(function (connection) {
    return this._executeRequest(connection, 'callProcedure');
  }.bind(this));
};

// Passthru to some column functions
function makePassthruFunction(name) {
  return function () {
    if (!this._lastColumn) {
      throw new Error('This function can only be called after the column function.');
    }

    this._lastColumn[name].apply(this._lastColumn, arguments);
    return this;
  };
}

for (var i = 0; i < TediousPromiseColumn.prototype._passthruFunctions.length; i++) {
  var name = TediousPromiseColumn.prototype._passthruFunctions[i];

  if (TediousPromise.prototype[name]) {
    throw new Error('Duplicate function defined in TediousPromiseColumn.prototype._passthruFunctions: ' + name + '.');
  }

  TediousPromise.prototype[name] = makePassthruFunction(name);
}

////////////////////////////////////////
module.exports = TediousPromise;
