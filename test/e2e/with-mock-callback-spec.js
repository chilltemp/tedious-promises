'use strict';
var testCommon = require('../testCommon');
var Connection = require('tedious').Connection;
var TediousPromises = require('../../src').TediousPromises;
var _ = require('lodash');


describe('with mock callback', function() {
  var self;
  var tp;

  beforeEach(function() {
    self = this;
    tp = testCommon.initWithoutPool(self);
  });

  it('should not call the real execute method', function(done) {
    var executeSpy = spyOn(Connection.prototype, 'execSql');

    var tp = new TediousPromises()
      .setMockDataCallback(function() { return []; });

    tp.sql('bad sql to cause a failure')
      .execute()
      .then(function() {
        expect(executeSpy).not.toHaveBeenCalled();
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('should call the mock data function', function(done) {
    var spy = jasmine.createSpy().andReturn([]);

    var tp = new TediousPromises()
      .setMockDataCallback(spy);

    tp.sql('something sql')
      .execute()
      .then(function(result) {
        expect(spy).toHaveBeenCalledWith('something sql', jasmine.any(Object));
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('should return the mocked data', function(done) {
    var data = [
      {
        col1: 123,
        col2: 'row 1'
      }, {
        col1: 456,
        col2: 'row 2'
      }
    ];

    var tp = new TediousPromises()
      .setMockDataCallback(function() { return data; });

    tp.sql('bad sql to cause a failure')
      .execute()
      .then(function(result) {
        expect(result).toEqual(data);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('should not rename columns unless asked to', function(done) {
    // ignore 'not cammel case' warnings
    /*jshint -W106 */
    var data = [
      {
        col_one: 123,
        col_two: 'row 1'
      }, {
        col_one: 456,
        col_two: 'row 2'
      }
    ];
    /*jshint +W106 */

    var tp = new TediousPromises()
      .setMockDataCallback(function() { return data; });

    tp.sql('bad sql to cause a failure')
      .execute()
      .then(function(result) {
        expect(result).toEqual(data);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('should rename columns when asked to', function(done) {
    // ignore 'not cammel case' warnings
    /*jshint -W106 */
    var data = [
      {
        col_one: 123,
        col_two: 'row 1'
      }, {
        col_one: 456,
        col_two: 'row 2'
      }
    ];
    /*jshint +W106 */

    var renamedData = [
      {
        colOne: 123,
        colTwo: 'row 1'
      }, {
        colOne: 456,
        colTwo: 'row 2'
      }
    ];

    var tp = new TediousPromises()
      .setDefaultColumnRenamer(_.camelCase)
      .setMockDataCallback(function() { return data; });

    tp.sql('bad sql to cause a failure')
      .execute()
      .then(function(result) {
        expect(result).toEqual(renamedData);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('mock data that isnt an array should fail gracefully', function(done) {
    var tp = new TediousPromises()
      .setDefaultColumnRenamer(_.camelCase)
      .setMockDataCallback(function() { return 'bad data'; });

    tp.sql('bad sql to cause a failure')
      .execute()
      .then(function(result) {
        self.fail('should not be called');
      }).fail(function(err) {
        expect(err instanceof Error).toEqual(true);
      }).fin(done);
  });

});

