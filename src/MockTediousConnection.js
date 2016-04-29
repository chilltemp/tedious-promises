'use strict';

// var TediousPromise = require('./TediousPromise');
var _ = require('lodash');

function MockTediousConnection(tediousPromise) {
  this._tediousPormise = tediousPromise;
  this.lastTransactionAction = 'none';
}

MockTediousConnection.prototype.beginTransaction = function (callback) {
  this.lastTransactionAction = 'begin';
  callback();
};

MockTediousConnection.prototype.saveTransaction = function (callback) {
  this.lastTransactionAction = 'save';
  callback();
};

MockTediousConnection.prototype.commitTransaction = function (callback) {
  this.lastTransactionAction = 'commit';
  callback();
};

MockTediousConnection.prototype.rollbackTransaction = function (callback) {
  this.lastTransactionAction = 'rollback';
  callback();
};

MockTediousConnection.prototype.execSql = function (request) {
  // raise row.on('row', callback) for each row of the mock data

  var data = null;
  var rowCount = 0;

  var scope = {
    outputParameter: this._tediousPormise._handleOutputParameter.bind(this._tediousPormise),
  };

  try {
    data = this._tediousPormise._mockDataCallback.call(scope, this._tediousPormise._sql, this._tediousPormise._parameters);

    // jscs:disable disallowEmptyBlocks
    if (typeof data === 'undefined' || data === null) {
      // do nothing

    } else if (_.isArray(data)) {
      var row = [];

      var makeColumn = function (value, key) {
        row.push({
          metadata: {
            colName: key,
          },
          value: value,
        });
      };

      for (var i = 0; i < data.length; i++) {
        _.forIn(data[i], makeColumn);

        // Warning: _events is a private object of a tedious Request, may change
        request._events.row(row);
      }

    } else {
      throw new Error('Mock data must be an array of rows or null.');
    }

    // jscs:enable disallowEmptyBlocks

    request.userCallback(null, rowCount);
  } catch (e) {
    request.userCallback(e, rowCount);
  }
};

MockTediousConnection.prototype.callProcedure = function (request) {
  this.execSql(request);
};

module.exports = MockTediousConnection;
