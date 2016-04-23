'use strict';
var testCommon = require('../testCommon');
var testDatabase = require('../database/resetTestDatabase');
var transactionsTable = require('../database/transactionsTable.json');

describe('with transactions', function () {
  var self;
  var tp;

  beforeEach(function (done) {
    self = this;
    tp = testCommon.initWithoutPool(self);

    testDatabase.resetTransactionsTableData()
      .fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  describe('commit', function () {

    it('insert row', function (done) {
      var testSql = transactionsTable.groupA.insert;
      var testExpectedResult = transactionsTable.groupA.rowCount;
      var verifySql = transactionsTable.groupA.select;
      var verifyExpectedResult = transactionsTable.groupA.data;

      var trans;
      tp.beginTransaction()
        .then(function (newTransaction) {
          trans = newTransaction;

          return trans.sql(testSql)
            .returnRowCount()
            .execute();
        })
        .then(function (testResult) {
          expect(testResult).toEqual(testExpectedResult);

          return trans.commitTransaction();
        })
        .then(function () {
          return tp.sql(verifySql)
            .execute();
        })
        .then(function (verifyResult) {
          expect(verifyResult).toEqual(verifyExpectedResult);
        })
        .fail(function (err) {
          self.fail(err);
        })
        .fin(done);
    });
  }); // commit

  describe('rollback', function () {

    it('insert row', function (done) {
      var testSql = transactionsTable.groupA.insert;
      var testExpectedResult = transactionsTable.groupA.rowCount;
      var verifySql = transactionsTable.groupA.select;
      var verifyExpectedResult = [];

      var trans;
      tp.beginTransaction()
        .then(function (newTransaction) {
          trans = newTransaction;

          return trans.sql(testSql)
            .returnRowCount()
            .execute();
        })
        .then(function (testResult) {
          expect(testResult).toEqual(testExpectedResult);

          return trans.rollbackTransaction();
        })
        .then(function () {
          // Should not be on the trans
          return tp.sql(verifySql)
            .execute();
        })
        .then(function (verifyResult) {
          expect(verifyResult).toEqual(verifyExpectedResult);
        })
        .fail(function (err) {
          self.fail(err);
        })
        .fin(done);
    });
  }); // rollback

  describe('default rollback', function () {

    it('insert row', function (done) {
      var testSql = transactionsTable.groupA.insert;
      var testExpectedResult = transactionsTable.groupA.rowCount;
      var verifySql = transactionsTable.groupA.select;
      var verifyExpectedResult = [];

      var trans;
      tp.beginTransaction()
        .then(function (newTransaction) {
          trans = newTransaction;

          return trans.sql(testSql)
            .returnRowCount()
            .execute();
        })
        .then(function (testResult) {
          expect(testResult).toEqual(testExpectedResult);

          return trans.rollbackTransaction();
        })
        .then(function () {
          // Should not be on the trans
          return tp.sql(verifySql)
            .execute();
        })
        .then(function (verifyResult) {
          expect(verifyResult).toEqual(verifyExpectedResult);
        })
        .fail(function (err) {
          self.fail(err);
        })
        .fin(done);
    });
  }); // rollback
});

