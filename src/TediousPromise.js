'use strict';
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TediousPromiseColumn = require('./TediousPromiseColumn');
var MockTediousConnection = require('./MockTediousConnection');
var q = require('q');
var _ = require('lodash');



function TediousPromise(mode, option) {
  // TODO: Transaction support - Accept an open transaction on the constructor

  if(mode === 'pool' && _.isObject(option) && _.isFunction(option.acquire)) {
    this._connectionPool = option;

  } else if(mode === 'single' && _.isObject(option)) {
    this._connectionConfig = option;

  } else if(mode === 'mock' && _.isFunction(option)) {
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

TediousPromise.prototype._createConnection = function() {
  // TODO: Transaction support - if transaction, resolve with transaction's connection
  var differed = q.defer();

  if(this._mode === 'mock') {
    return q(new MockTediousConnection(this));

  } else if(this._mode === 'pool') {
    // get from pool
    this._connectionPool.acquire(function (err, connection) {
      try {
        if (err) {
          connection.release();
          differed.reject(err);
        } else {
          enableDebugLogging(connection);
          differed.resolve(connection);
        }
      } catch(e) {
        differed.reject(e);
      }
    });

  } else if (this._mode === 'single') {
    // create new connection
    var connection = new Connection(this._connectionConfig);

    connection.on('connect', function(err) {
      try {
        if (err) {
          connection.close();
          differed.reject(err);
        } else {
          enableDebugLogging(connection);
          differed.resolve(connection);
        }
      } catch(e) {
        differed.reject(e);
      }
    });

  } else {
    throw new Error('Create connection not implemented for mode: ' + this._mode + '.');
  }

  return differed.promise;
};

TediousPromise.prototype._disposeConnection = function(connection) {
  // TODO: Transaction support - if transaction, do nothing

  if(this._mode === 'mock') {
    return; // nothing to do for the mock

  } else if(this._mode === 'pool') {
    if(_.isFunction(connection.release)) {
      // release from connection pool
      connection.release();
    }

  } else if (this._mode === 'single') {
    connection.close();

  } else {
    throw new Error('Dispose connection not implemented for mode: ' + this._mode + '.');
  }

};

TediousPromise.prototype._executeRequest = function(connection) {
  var differed = q.defer();
  var results = [];

  var request = new Request(this._sql, function(error, rowCount) {
    try {
      this._disposeConnection(connection);

      if (error) {
        differed.reject(error);
        return;
      } else {

        if(this._forEachRow) {
          differed.resolve();
        } else {
          differed.resolve(results);
        }
      }
    } catch(e) {
      differed.reject(e);
    }
  }.bind(this));

  request.on('row', function(row) {
    try {
      var result = {};

      for (var i = 0; i < row.length; i++) {
        var col = row[i];
        var map = this._columns[col.metadata.colName];

        if(!map) {
          // create default mapping if needed
          if(_.isFunction(this.defaultColumnRenamer)) {
            map = new TediousPromiseColumn(col.metadata.colName, this.defaultColumnRenamer(col.metadata.colName));
          } else {
            map = new TediousPromiseColumn(col.metadata.colName);
          }

          this._columns[col.metadata.colName] = map;
        }

        map._applyMapping(col, result);
      }

      if(this._forEachRow) {
        this._forEachRow(result);
      } else {
        results.push(result);
      }
    } catch(e) {
      differed.reject(e);
    }
  }.bind(this));

  _.forEach(this._parameters, function(p) {
    request.addParameter( p.name, p.type, p.value, p.options);
  });

  _.forEach(this._outputParameters, function(p) {
    request.addOutputParameter( p.name, p.type, p.value, p.options);
  });

  connection.execSql(request);
  return differed.promise;
};




TediousPromise.prototype.sql = function(sql) {
  if(this._sql) {
    throw new Error('SQL already set.');
  }

  if(typeof sql !== 'string') {
    throw new Error('SQL must be a string, received '+(typeof sql)+'.');
  }

  this._sql = sql;
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.column = function(name, mapping) {
  var map;

  if(mapping instanceof TediousPromiseColumn) {
    map = mapping;

  } else if(typeof mapping === 'undefined' && _.isFunction(this.defaultColumnRenamer)) {
    map = new TediousPromiseColumn(name, this.defaultColumnRenamer(name));

  } else if(typeof mapping === 'undefined' || typeof mapping === 'string') {
    map = new TediousPromiseColumn(name, mapping);

  } else {
    throw new Error('Unexpected collumn mapping type: '+ (typeof mapping) +'.');
  }

  this._columns[name] = map;
  this._lastColumn = map;
  return this;
};

TediousPromise.prototype.parameter = function(name, type, value, options) {
  this._parameters[name] = {
    name: name,
    type: type,
    value: value,
    options: options
  };
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.outputParameter = function(name, type, value, options) {
  this._outputParameters[name] = {
    name: name,
    type: type,
    value: value,
    options: options
  };
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.forEachRow = function(callback) {
  if(typeof callback !== 'function') {
    throw new Error('Callback must be a function.');
  }

  this._forEachRow = callback;
  this._lastColumn = null;
  return this;
};

TediousPromise.prototype.execute = function() {
  this._lastColumn = null;

  return this._createConnection()
  .then(function(connection) {
    return this._executeRequest(connection);
  }.bind(this));
};



// Passthru to some column functions
function makePassthruFunction(name) {
  console.log('Making passthru fn: '+name);
  return function() {
    if(!this._lastColumn) {
      throw new Error('This function can only be called after the column function.');
    }

    this._lastColumn[name].apply(this._lastColumn, arguments);
    return this;
  };
}

for (var i = 0; i < TediousPromiseColumn.prototype._passthruFunctions.length; i++ ) {
  var name = TediousPromiseColumn.prototype._passthruFunctions[i];

  if(TediousPromise.prototype[name]) {
    throw new Error('Duplicate function defined in TediousPromiseColumn.prototype._passthruFunctions: '+name+'.');
  }

  TediousPromise.prototype[name] = makePassthruFunction(name);
}


////////////////////////////////////////
module.exports = TediousPromise;
