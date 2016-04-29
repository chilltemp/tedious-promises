'use strict';
var _ = require('lodash');
_.mixin(require('lodash-deep'));

function TediousPromiseColumn(name, path) {
  if (typeof name !== 'string') {
    throw 'Name must be a string.';
  }

  if (typeof path !== 'undefined' && typeof path !== 'string') {
    throw 'Path must be a string';
  }

  this.name = name;
  this._path = path;
}

TediousPromiseColumn.prototype.overrideGetValue = function (getFunction) {
  if (typeof getFunction !== 'function') {
    throw new Error('Argument must be a function.');
  }

  this.GetColumnValue = getFunction;
  return this;
};

TediousPromiseColumn.prototype.overrideApplyMapping = function (applyFunction) {
  if (typeof applyFunction !== 'function') {
    throw new Error('Argument must be a function.');
  }

  this._applyMapping = applyFunction;
  return this;
};

TediousPromiseColumn.prototype.GetColumnValue = function (column) {
  return column.value;
};

TediousPromiseColumn.prototype._applyMapping = function (column, result) {
  var value = this.GetColumnValue(column);

  if (this._path)  {
    _.deepSet(result, this._path, value);
  } else {
    result[this.name] = value;
  }

};

TediousPromiseColumn.prototype.asBoolean = function () {
  return this.overrideGetValue(function (column) {

    if (column.value === undefined || column.value === null) {
      return null;
    }

    if (_.isFinite(column.value)) {
      return column.value !== 0;
    }

    if (_.isString(column.value)) {
      var str = column.value.toUpperCase();

      if (str === 'TRUE' || str === 'T' || str === 'Y' || str === 'YES' || str === '1') {
        return true;
      }

      if (str === 'FALSE' || str === 'F' || str === 'N' || str === 'NO' || str === '0') {
        return false;
      }
    }

    throw new Error('Unable to convert "' + column.value + '" to a boolean.');
  });
};

TediousPromiseColumn.prototype.asDate = function () {
  return this.overrideGetValue(function (column) {
    if (column.value === undefined || column.value === null) {
      return null;
    }

    if (_.isFinite(column.value)) {
      return new Date(column.value);
    }

    return Date.parse(column.value);
  });
};

// these functions will be exposed on the TediousPromise object.  To be called after creating a column.
TediousPromiseColumn.prototype._passthruFunctions = ['asBoolean', 'asDate', 'overrideApplyMapping', 'overrideGetValue'];

module.exports = TediousPromiseColumn;
