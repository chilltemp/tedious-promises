'use strict';
var _ = require('lodash');

function flattenTediousPromiseParameters(parameters, required) {
  var flattened = _.mapValues(parameters, 'value');

  if (_.isArray(required)) {
    var keys = _.keys(flattened);

    var missing = _.difference(required, keys);
    if (missing && missing.length) {
      throw new Error('Some required parameters are missing: ' + JSON.stringify(missing) + '.');
    }

    var extra = _.difference(keys, required);
    if (extra && extra.length) {
      throw new Error('Some extra parameters were found: ' + JSON.stringify(extra) + '.');
    }
  }

  return flattened;
}

function MockData(data) {
  if (typeof data === 'undefined' || data.length === 0) {
    throw new Error('No mock data.');
  }

  this._data = data;
}

MockData.prototype.select = function (columnNames) {
  if (_.isArray(columnNames)) {
    // use 'map + pick' to copy selected columns
    return _.map(this._data, _.partialRight(_.pick, columnNames));
  } else {
    return this._data;
  }
};

MockData.prototype.where = function (actualParameters, requiredParameters) {
  //module.exports.findMockData = function(title, sourceData, actualParameters, requiredParameters) {
  var flattened = flattenTediousPromiseParameters(actualParameters, requiredParameters);
  this._data = _.where(this._data, flattened);
  if (typeof this._data === 'undefined' || this._data.length === 0) {
    throw new Error('No mock data found for: ' + JSON.stringify(flattened) + '.');
  }

  return this;
};

module.exports = MockData;
