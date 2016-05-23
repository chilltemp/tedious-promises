'use strict';
var testCommon = require('../testCommon');
var ConnectionPool = require('tedious-connection-pool');

var simpleTable = require('../database/simpleTable.json');

describe('with connection pooling', function () {
  var self;
  var tp;

  beforeEach(function () {
    self = this;
    tp = testCommon.initWithPool(self).tp;
  });

  it('should acquire and release connections', function (done) {
    var acquireSpy = spyOn(ConnectionPool.prototype, 'acquire').andCallThrough();
    var releaseSpy = spyOn(ConnectionPool.prototype, 'release').andCallThrough();

    tp.sql(simpleTable.selectRow1)
    .execute()
    .then(function () {
      expect(acquireSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
    }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('should fail to acquire a connection', function (done) {
    var acquireSpy = spyOn(ConnectionPool.prototype, 'acquire').andCallFake(function (callback) {
      callback(true, null);
    });

    tp.sql(simpleTable.selectRow1)
    .execute()
    .then(function () {
      self.fail('this should not happen');
    }).fail(function (err) {
      expect(acquireSpy).toHaveBeenCalled();
    }).fin(done);
  });

  it('should acquire a connection with an error', function (done) {
    var connection = { release: function () {} };

    var releaseSpy = spyOn(connection, 'release');

    var acquireSpy = spyOn(ConnectionPool.prototype, 'acquire').andCallFake(function (callback) {
      callback(true, connection);
    });

    tp.sql(simpleTable.selectRow1)
    .execute()
    .then(function () {
      self.fail('this should not happen');
    }).fail(function (err) {
      expect(acquireSpy).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalled();
    }).fin(done);
  });

  it('should acquire a connection with error and throw exception', function (done) {
    var errMsg = '';
    var connection = { release: function () {
      throw errMsg;
    } };

    var acquireSpy = spyOn(ConnectionPool.prototype, 'acquire').andCallFake(function (callback) {
      callback(true, connection);
    });

    tp.sql(simpleTable.selectRow1)
    .execute()
    .then(function () {
      self.fail('this should not happen');
    }).fail(function (err) {
      expect(acquireSpy).toHaveBeenCalled();
      expect(err).toBe(errMsg);
    }).fin(done);
  });
});

