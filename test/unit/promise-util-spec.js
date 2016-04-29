'use strict';
var PromiseUtil = require('../../src/PromiseUtil');
var testCommon = require('../testCommon');
var TediousPromises = require('../../src').TediousPromises;
var q = require('q');

describe('PromiseUtil', function () {
  var self;
  var tp;
  var resolvedData = [{ resolved: true }];

  beforeEach(function () {
    self = this;
    testCommon.init(self);

    tp = new TediousPromises()
      .setMockDataCallback(mockCallback);
  });

  function mockCallback(sql, params) {
    if (sql === 'RESOLVE') {
      return resolvedData;
    } else {
      throw new Error('REJECT');
    }
  }

  describe('q', function () {
    beforeEach(function () {
      tp.setPromiseLibrary('q');
    });

    it('must pass validation', function () {
      var lib = PromiseUtil.getNamedLibrary('q');
      PromiseUtil.validateLibrary(lib);
    });

    it('lib.defer() must be returned its promise type', function () {
      var lib = PromiseUtil.getNamedLibrary('q');
      var deffered = lib.defer();

      expect(deffered.promise.constructor.name).toBe('Promise');
      expect(deffered.promise instanceof q.makePromise).toBe(true);
      expect(deffered.promise instanceof Promise).toBe(false);

      deffered.resolve();
    });

    it('must be returned by execute()', function (done) {
      var promise = tp.sql('RESOLVE')
        .execute();

      expect(promise.constructor.name).toBe('Promise');
      expect(promise instanceof q.makePromise).toBe(true);
      expect(promise instanceof Promise).toBe(false);

      promise.then(function () {
          done();
        })
        .fail(function (err) {
          self.fail(err);
          done();
        });
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
    beforeEach(function () {
      tp.setPromiseLibrary('es6');
    });

    it('must pass validation', function () {
      var lib = PromiseUtil.getNamedLibrary('es6');
      PromiseUtil.validateLibrary(lib);
    });

    it('lib.defer().promise must be returned its promise type', function () {
      var lib = PromiseUtil.getNamedLibrary('es6');
      var deffered = lib.defer();

      expect(deffered.promise.constructor.name).toBe('Promise');
      expect(deffered.promise instanceof q.makePromise).toBe(false);
      expect(deffered.promise instanceof Promise).toBe(true);

      deffered.resolve();
    });

    it('must be returned by execute()', function (done) {
      var promise = tp.sql('RESOLVE')
        .execute();

      expect(promise.constructor.name).toBe('Promise');
      expect(promise instanceof q.makePromise).toBe(false);
      expect(promise instanceof Promise).toBe(true);

      promise.then(function () {
          done();
        })
        .catch(function (err) {
          self.fail(err);
          done();
        });
    });

    it('resolve must .then()', function (done) {
      tp.sql('RESOLVE')
        .execute()
        .then(function (data) {
          // test for es6 promise?
          expect(data).toEqual(resolvedData);
          done();
        })
        .catch(function (err) {
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

