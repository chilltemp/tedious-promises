'use strict';
var testCommon = require('../testCommon');
var _ = require('lodash');

var simpleTable = require('../database/simpleTable.json');
var typesTable = require('../database/typesTable.json');
var booleanTable = require('../database/booleanTable.json');

// convert dates in sample data
typesTable = _.cloneDeep(typesTable);

for (var i = 0; i < typesTable.data.length; i++) {
  // console.log(typesTable.data[i], Date.parse(typesTable.data[i]));
  typesTable.data[i].dates = Date.parse(typesTable.data[i].dates);
}

describe('columns', function () {
  var self;
  var tp;

  beforeEach(function () {
    self = this;
    tp = testCommon.initWithoutPool(self);
  });

  it('explicit', function (done) {
    tp.sql(simpleTable.selectRow1)
      .column('col1')
      .column('col2')
      .execute()
      .then(function (results) {
        expect(results).toEqual(simpleTable.data.slice(0, 1));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('implicit', function (done) {
    tp.sql(simpleTable.selectRow1)
      .execute()
      .then(function (results) {
        expect(results).toEqual(simpleTable.data.slice(0, 1));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('string', function (done) {
    tp.sql(typesTable.selectAllStrings)
      .execute()
      .then(function (results) {
        expect(results).toEqual(testCommon.selectColumn(typesTable.data, 'strings'));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('date', function (done) {
    tp.sql(typesTable.selectAllDates)
      .column('dates').asDate()
      .execute()
      .then(function (results) {
        expect(results).toEqual(testCommon.selectColumn(typesTable.data, 'dates'));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('number', function (done) {
    tp.sql(typesTable.selectAllNumbers)
      .execute()
      .then(function (results) {
        expect(results).toEqual(testCommon.selectColumn(typesTable.data, 'numbers'));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('mixed columns with 1 type conversion', function (done) {
    tp.sql(typesTable.selectAll)
      .column('dates').asDate()
      .execute()
      .then(function (results) {
        expect(results).toEqual(typesTable.data);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('number as boolean', function (done) {
    tp.sql(booleanTable.selectAllNumbers)
      .column('numbers').asBoolean()
      .execute()
      .then(function (results) {
        expect(results).toEqual(testCommon.selectColumn(booleanTable.data, 'numbers'));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('string as boolean', function (done) {
    tp.sql(booleanTable.selectAllStrings)
      .column('strings').asBoolean()
      .execute()
      .then(function (results) {
        expect(results).toEqual(testCommon.selectColumn(booleanTable.data, 'strings'));
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('null as boolean', function (done) {
    tp.sql(booleanTable.selectNulls)
      .column('strings').asBoolean()
      .execute()
      .then(function (results) {
        expect(results).toEqual(booleanTable.dataNulls);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('should rename', function (done) {
    tp.sql(simpleTable.selectRow1)
      .column('col1', 'firstName')
      .column('col2', 'lastName')
      .execute()
      .then(function (results) {
        expect(results).toEqual([{
          firstName: simpleTable.data[0].col1,
          lastName: simpleTable.data[0].col2,
        }]);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('should deep set', function (done) {
    tp.sql(simpleTable.selectRow1)
      .column('col1', 'firstLevel.alpha')
      .column('col2', 'firstLevel.beta.third')
      .execute()
      .then(function (results) {
        expect(results).toEqual([{
          firstLevel: {
            alpha: simpleTable.data[0].col1,
            beta: {
              third: simpleTable.data[0].col2,
            },
          },
        }]);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });

  it('custom type converter', function (done) {
    var expected = typesTable.data.map(function (x) {
      return { strings: x.strings.charAt(0) };
    });

    tp.sql(typesTable.selectAllStrings)
      .column('strings').overrideGetValue(function (column) {
        return column.value.charAt(0);
      })
      .execute()
      .then(function (results) {
        expect(results).toEqual(expected);
      }).fail(function (err) {
        self.fail(err);
      }).fin(done);
  });
});

