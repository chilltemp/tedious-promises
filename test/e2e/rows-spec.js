'use strict';
var testCommon = require('../testCommon');

var simpleTable = require('../database/simpleTable.json');

describe('row transformations', function () {
  var self;
  var tp;

  beforeEach(function () {
    self = this;
    tp = testCommon.initWithoutPool(self);
  });

  describe('default (rowToObject)', function () {
    it('gather all results', function (done) {
      tp.sql(simpleTable.selectRows1to10)
        .execute()
        .then(function (results) {
          expect(results).toEqual(simpleTable.data);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });

    it('for each row', function (done) {
      var cnt = 0;
      var expectedRows = 10;

      tp.sql(simpleTable.selectRows1to10)
        .forEachRow(function (row) {
          expect(row).toEqual(simpleTable.data[cnt++]);
        })
        .execute()
        .then(function (results) {
          // result is row count for .forEachRow
          expect(results).toBe(expectedRows);
          expect(cnt).toBe(expectedRows);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });
  });

  describe('rowToObject', function () {
    it('gather all results', function (done) {
      tp.sql(simpleTable.selectRows1to10)
        .rowTransformer('rowToObject')
        .execute()
        .then(function (results) {
          expect(results).toEqual(simpleTable.data);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });

    it('for each row', function (done) {
      var cnt = 0;
      var expectedRows = 10;

      tp.sql(simpleTable.selectRows1to10)
        .rowTransformer('rowToObject')
        .forEachRow(function (row) {
          expect(row).toEqual(simpleTable.data[cnt++]);
        })
        .execute()
        .then(function (results) {
          // result is row count for .forEachRow
          expect(results).toBe(expectedRows);
          expect(cnt).toBe(expectedRows);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });
  });

  describe('custom transformer function', function () {

    function customTransformer(row, getColumnMap) {
      var result = [];

      for (var i = 0; i < row.length; i++) {
        var col = row[i];
        var name = col.metadata.colName;

        var map = getColumnMap(name);
        var value = map.GetColumnValue(col);

        result.push(name);
        result.push(value);
      }

      return result;
    }

    it('gather all results', function (done) {
      tp.sql(simpleTable.selectRows1to10)
        .rowTransformer(customTransformer)
        .execute()
        .then(function (results) {
          expect(results).toEqual(simpleTable.dataCustomTransformer);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });

    it('for each row', function (done) {
      var cnt = 0;
      var expectedRows = 10;

      tp.sql(simpleTable.selectRows1to10)
        .rowTransformer(customTransformer)
        .forEachRow(function (row) {
          expect(row).toEqual(simpleTable.dataCustomTransformer[cnt++]);
        })
        .execute()
        .then(function (results) {
          // result is row count for .forEachRow
          expect(results).toBe(expectedRows);
          expect(cnt).toBe(expectedRows);
        }).fail(function (err) {
          self.fail(err);
        }).fin(done);
    });
  });
});
