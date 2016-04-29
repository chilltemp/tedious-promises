'use strict';
var q = require('q');
var _ = require('lodash');

var namedLibraries = {
  q: q,
  es6: {
    defer: function () {
      var deferred = {};

      deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });

      return deferred;
    },

    resolve: function (value) {
      return Promise.resolve(value);
    },

    reject: function (value) {
      return Promise.reject(value);
    },
  },
};

function getNamedLibrary(name) {
  if (!namedLibraries.hasOwnProperty(name)) {
    throw new Error('Named promise library "' + name + '" not found.');
  }

  return namedLibraries[name];
}

function validateLibrary(library) {

  if (!_.isObject(library)) {
    throw new Error('Promise library must be an object.');
  }

  if (!_.isFunction(library.defer)) {
    throw new Error('Promise library must have a "defer" function.');
  }

  if (!_.isFunction(library.reject)) {
    throw new Error('Promise library must have a "reject" function.');
  }

  if (!_.isFunction(library.resolve)) {
    throw new Error('Promise library must have a "resolve" function.');
  }

  var deferred = library.defer();

  if (!_.isFunction(deferred.reject)) {
    throw new Error('Promise library\'s deferred object must have a "reject" function.');
  }

  if (!_.isFunction(deferred.resolve)) {
    throw new Error('Promise library\'s deferred object must have a "resolve" function.');
  }

  if (!_.isObject(deferred.promise)) {
    throw new Error('Promise library\'s deferred object must have a "promise" function.');
  }

  if (!_.isFunction(deferred.promise.then)) {
    throw new Error('Promise library\'s deferred.promise object must have a "then" function.');
  }

  // just in case the library cares if we never complete the promise
  deferred.resolve();

}

function getOrValidateLibrary(libraryOrName) {
  if (_.isString(libraryOrName)) {
    return getNamedLibrary(libraryOrName);
  } else {
    validateLibrary(libraryOrName);
    return libraryOrName;
  }
}

module.exports.getNamedLibrary = getNamedLibrary;
module.exports.getOrValidateLibrary = getOrValidateLibrary;
module.exports.validateLibrary = validateLibrary;

