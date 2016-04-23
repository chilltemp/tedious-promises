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

});

