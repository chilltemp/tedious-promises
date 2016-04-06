'use strict';
var testCommon = require('../testCommon');
var testDatabase = require('../database/resetTestDatabase');
var transactionsTable = require('../database/transactionsTable.json');


describe('without transactions', function() {
  var self;
  var tp;

  beforeEach(function(done) {
    self = this;
    tp = testCommon.initWithoutPool(self);

    testDatabase.resetTransactionsTableData()
      .fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('insert row', function(done) {
    var testSql = transactionsTable.groupA.insert;
    var testExpectedResult = transactionsTable.groupA.rowCount;
    var verifySql = transactionsTable.groupA.select;
    var verifyExpectedResult = transactionsTable.groupA.data;

    tp.sql(testSql)
      .returnRowCount()
      .execute()
      .then(function(testResult) {
        expect(testResult).toEqual(testExpectedResult);

        return tp.sql(verifySql)
          .execute();
      }).then(function(verifyResult) {
        expect(verifyResult).toEqual(verifyExpectedResult);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('update row', function(done) {
    var testSql = transactionsTable.groupB.update;
    var testExpectedResult = transactionsTable.groupB.rowCount;
    var verifySql = transactionsTable.groupB.select;
    var verifyExpectedResult = transactionsTable.groupB.data;

    tp.sql(testSql)
      .returnRowCount()
      .execute()
      .then(function(testResult) {
        expect(testResult).toEqual(testExpectedResult);

        return tp.sql(verifySql)
          .execute();
      }).then(function(verifyResult) {
        expect(verifyResult).toEqual(verifyExpectedResult);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

  it('delete row', function(done) {
    var testSql = transactionsTable.groupC.delete;
    var testExpectedResult = transactionsTable.groupC.rowCount;
    var verifySql = transactionsTable.groupC.select;
    var verifyExpectedResult = transactionsTable.groupC.data;

    tp.sql(testSql)
      .returnRowCount()
      .execute()
      .then(function(testResult) {
        expect(testResult).toEqual(testExpectedResult);

        return tp.sql(verifySql)
          .execute();
      }).then(function(verifyResult) {
        expect(verifyResult).toEqual(verifyExpectedResult);
      }).fail(function(err) {
        self.fail(err);
      }).fin(done);
  });

});

