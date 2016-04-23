'use strict';
var testCommon = require('../testCommon');
var TYPES = require('tedious').TYPES;
var TediousPromises = require('../../src').TediousPromises;

var simpleTable = require('../database/simpleTable.json');


describe('misc', function() {
  var self;
  var tp;

  beforeEach(function() {
    self = this;
    tp = testCommon.initWithoutPool(self);
  });

  it('gather all results', function (done) {
    tp.sql(simpleTable.selectRows1to10)
      .execute()
      .then(function(results) {
        expect(results).toEqual(simpleTable.data);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('for each row', function (done) {
    var cnt = 0;
    var expectedRows = 10;

    tp.sql(simpleTable.selectRows1to10)
      .forEachRow(function(row) {
        expect(row).toEqual(simpleTable.data[cnt++]);
      })
      .execute()
      .then(function(results) {
        // result is row count for .forEachRow
        expect(results).toBe(expectedRows);
        expect(cnt).toBe(expectedRows);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('with a parameter', function (done) {
    tp.sql(simpleTable.selectRowById)
      .parameter('id', TYPES.Int, 6)
      .execute()
      .then(function(results) {
        expect(results).toEqual(simpleTable.data.slice(5,6));
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('with bad sql should fail the promise', function (done) {
    tp.sql('select bad sql')
      .execute()
      .then(function(results) {
        self.fail('should not be called');
      }).fail(function(err) {
        expect(err instanceof Error).toEqual(true);
      }).fin(done);
  });

  describe('with bad configuration', function() {

    it('should require either pool or config', function() {
      var tp = new TediousPromises();

      try {
        tp.sql(simpleTable.selectRow1);
        self.fail('should be unreachable');
      } catch(e) {
        expect(e instanceof Error).toEqual(true);
        expect(e.message).toMatch(/config/i);
        expect(e.message).toMatch(/pool/i);
      }
    });

  }); // describe with bad configuration

});

