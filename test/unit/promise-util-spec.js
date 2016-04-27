'use strict';
var PromiseUtil = require('../../src/PromiseUtil');
// var testCommon = require('../testCommon');
var TediousPromises = require('../../src').TediousPromises;

describe('PromiseUtil', function () {
  var self;
  var tp;
  var resolvedData = [{ resolved: true }];

  beforeEach(function () {
    self = this;
    tp = new TediousPromises()
      .setMockDataCallback(mockCallback);
  });

  function mockCallback(sql, params) {
    console.log('M', sql, params);
    if (sql === 'RESOLVE') {
      return resolvedData;
    } else {
      throw new Error('REJECT');
    }
  }

  describe('q', function () {
    it('must pass validation', function () {
      var lib = PromiseUtil.getNamedLibrary('q');
      PromiseUtil.validateLibrary(lib);
    });

    it('resolve must .then()', function (done) {
      tp.sql('RESOLVE')
        .execute()
        .then(function (data) {
          expect(data).toEqual(resolvedData);
          done();
        })
        .fail(function (err) {
          self.fail(err);
          done();
        });
    });

    it('reject must .fail()', function (done) {
      tp.sql('REJECT')
        .execute()
        .then(function (data) {
          self.fail('Should not get here');
          done();
        })
        .fail(function (err) {
          expect(err.message).toBe('REJECT');
          done();
        });
    });
  });

  describe('es6', function () {
    it('must pass validation', function () {
      var lib = PromiseUtil.getNamedLibrary('es6');
      PromiseUtil.validateLibrary(lib);
    });

    it('resolve must .then()', function (done) {
      tp.sql('RESOLVE')
        .execute()
        .then(function (data) {
          expect(data).toEqual(resolvedData);
          done();
        })
        .fail(function (err) {
          self.fail(err);
          done();
        });
    });

    it('reject must .catch()', function (done) {
      tp.sql('REJECT')
        .execute()
        .then(function (data) {
          self.fail('Should not get here');
          done();
        })
        .catch(function (err) {
          expect(err.message).toBe('REJECT');
          done();
        });
    });
  });

});

