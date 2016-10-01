'use strict';
var testCommon = require('../testCommon');
var TYPES = require('tedious').TYPES;
var TediousPromises = require('../../src').TediousPromises;

var simpleTable = require('../database/simpleTable.json');

describe('misc', function () {
  var self;
  var tp;

  beforeEach(function () {
    self = this;
    tp = testCommon.initWithoutPool(self);
  });

  it('insert returning identity', function (done) {
    tp.sql(simpleTable.insertReturningIdentity)
      .execute()
      .then(function (results) {
        console.log('****', results);
        expect(results).toEqual(jasmine.any(Array));
        expect(results.length).toEqual(1);
        expect(results[0]).toEqual(jasmine.any(Object));
        expect(results[0]['']).toEqual(jasmine.any(Number));
        expect(results[0]['']).toBeGreaterThan(simpleTable.data.length);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('insert returning identity as', function (done) {
    tp.sql(simpleTable.insertReturningIdentityAs)
      .execute()
      .then(function (results) {
        console.log('****', results);
        expect(results).toEqual(jasmine.any(Array));
        expect(results.length).toEqual(1);
        expect(results[0]).toEqual(jasmine.any(Object));
        expect(results[0].id).toEqual(jasmine.any(Number));
        expect(results[0].id).toBeGreaterThan(simpleTable.data.length);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('with a parameter', function (done) {
    tp.sql(simpleTable.selectRowById)
      .parameter('id', TYPES.Int, 6)
      .execute()
      .then(function (results) {
        expect(results).toEqual(simpleTable.data.slice(5, 6));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('with bad sql should fail the promise', function (done) {
    tp.sql('select bad sql')
      .execute()
      .then(function (results) {
        self.fail('should not be called');
      }).fail(function (err) {
        expect(err instanceof Error).toEqual(true);
      }).fin(done);
  });

  describe('with bad configuration', function () {

    it('should require either pool or config', function () {
      var tp = new TediousPromises();

      try {
        tp.sql(simpleTable.selectRow1);
        self.fail('should be unreachable');
      } catch (e) {
        expect(e instanceof Error).toEqual(true);
        expect(e.message).toMatch(/config/i);
        expect(e.message).toMatch(/pool/i);
      }
    });

  }); // describe with bad configuration

});

