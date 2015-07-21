'use strict';
// var TediousPromise = require('./TediousPromise');
var _ = require('lodash');

function MockTediousConnection(tediousPromise) {
  this._tediousPormise = tediousPromise;
}

MockTediousConnection.prototype.execSql = function(request) {
  // raise row.on('row', callback) for each row of the mock data

  var data = null;
  var rowCount = 0;

  try {
    data = this._tediousPormise._mockDataCallback(this._tediousPormise._sql, this._tediousPormise._parameters);

    if(typeof data === 'undefined' || data === null) {
      // do nothing

    } else if(_.isArray(data)) {

      var makeColumn = function(value, key) {
        row.push({
          metadata: {
            colName: key
          },
          value: value
        });
      };

      for (var i = 0; i < data.length; i++) {
        var row = [];
        _.forIn(data[i], makeColumn);

        // Warning: _events is a private object of a tedious Request, may change
        request._events.row(row);
      }

    } else {
      throw new Error('Mock data must be an array of rows or null.');
    }

    request.userCallback(null, rowCount);
  } catch(e) {
    request.userCallback(e, rowCount);
  }
};

module.exports = MockTediousConnection;
