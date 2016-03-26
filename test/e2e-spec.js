'use strict';
var chalk = require('chalk');
var Connection = require('tedious').Connection;
var TYPES = require('tedious').TYPES;
var tediousPromises = require('../src');
var TediousPromises = tediousPromises.TediousPromises;
var _ = require('lodash');
var q = require('q');
var testDatabase = require('./database/resetTestDatabase');

// This will give failing unit tests better stack traces if they use promises
q.longStackSupport = true;


var dbConfig = require('./database/config.json');
var simpleTable = require('./database/simpleTable.json');
var typesTable = require('./database/typesTable.json');
var booleanTable = require('./database/booleanTable.json');

// convert dates in sample data
for (var i = 0; i < typesTable.data.length; i++) {
  // console.log(typesTable.data[i], Date.parse(typesTable.data[i]));
  typesTable.data[i].dates = Date.parse(typesTable.data[i].dates);
}

// for easy slicing of the data in the table files
function selectColumn(data, column) {
  return data.map(function(x) {
    var val = {};
    val[column] = x[column];
    return val;
  });
}


describe('tedious-promises', function () {
  var self;

  beforeEach(function() {
    self = this;
    console.log('Begin test: ' +
      chalk.magenta(this.suite.getFullName()) + ' ' +
      chalk.cyan(this.description));
  });

  describe('without connection pooling', function() {
    var tp;

    beforeEach(function() {
      var connectionConfig = _.cloneDeep(dbConfig);
      tp = new TediousPromises()
        .setConnectionConfig(connectionConfig);
    });

    describe('columns', function() {
      it('explicit', function (done) {
        tp.sql(simpleTable.selectRow1)
          .column('col1')
          .column('col2')
          .execute()
          .then(function(results) {
            expect(results).toEqual(simpleTable.data.slice(0,1));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('implicit', function (done) {
        tp.sql(simpleTable.selectRow1)
          .execute()
          .then(function(results) {
            expect(results).toEqual(simpleTable.data.slice(0,1));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('string', function (done) {
        tp.sql(typesTable.selectAllStrings)
          .execute()
          .then(function(results) {
            expect(results).toEqual(selectColumn(typesTable.data, 'strings'));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('date', function (done) {
        tp.sql(typesTable.selectAllDates)
          .column('dates').asDate()
          .execute()
          .then(function(results) {
            expect(results).toEqual(selectColumn(typesTable.data, 'dates'));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('number', function (done) {
        tp.sql(typesTable.selectAllNumbers)
          .execute()
          .then(function(results) {
            expect(results).toEqual(selectColumn(typesTable.data, 'numbers'));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('mixed columns with 1 type conversion', function (done) {
        tp.sql(typesTable.selectAll)
          .column('dates').asDate()
          .execute()
          .then(function(results) {
            expect(results).toEqual(typesTable.data);
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('number as boolean', function (done) {
        tp.sql(booleanTable.selectAllNumbers)
          .column('numbers').asBoolean()
          .execute()
          .then(function(results) {
            expect(results).toEqual(selectColumn(booleanTable.data, 'numbers'));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('string as boolean', function (done) {
        tp.sql(booleanTable.selectAllStrings)
          .column('strings').asBoolean()
          .execute()
          .then(function(results) {
            expect(results).toEqual(selectColumn(booleanTable.data, 'strings'));
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('null as boolean', function (done) {
        tp.sql(booleanTable.selectNulls)
          .column('strings').asBoolean()
          .execute()
          .then(function(results) {
            expect(results).toEqual(booleanTable.dataNulls);
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('should rename', function(done) {
        tp.sql(simpleTable.selectRow1)
          .column('col1', 'firstName')
          .column('col2', 'lastName')
          .execute()
          .then(function(results) {
            expect(results).toEqual([{
              firstName: simpleTable.data[0].col1,
              lastName: simpleTable.data[0].col2
            }]);
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('should deep set', function(done) {
        tp.sql(simpleTable.selectRow1)
          .column('col1', 'firstLevel.alpha')
          .column('col2', 'firstLevel.beta.third')
          .execute()
          .then(function(results) {
            expect(results).toEqual([{
              firstLevel: {
                alpha: simpleTable.data[0].col1,
                beta: {
                  third: simpleTable.data[0].col2
                }
              }
            }]);
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      it('custom type converter', function (done) {
        var expected = typesTable.data.map(function(x) {
          return { strings: x.strings.charAt(0) };
        });

        tp.sql(typesTable.selectAllStrings)
          .column('strings').overrideGetValue(function(column) {
            return column.value.charAt(0);
          })
          .execute()
          .then(function(results) {
            expect(results).toEqual(expected);
          }).fail(function(err) {
            self.fail(err);
          }).fin(done);
      });
    }); // describe columns

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


    describe('without transactions', function() {

      beforeEach(function(done) {
        testDatabase.resetTransactionsTableData()
          .fail(function(err) {
            self.fail(err);
          }).fin(done);
      });

      /*jshint -W109 */
      it('insert row', function(done) {
        var testSql = "insert into test.transactionsTable (col1, col2) values('qwerty', '123')";
        var testExpectedResult = 1;
        var verifySql = "select col1, col2 from test.transactionsTable where col1 = 'qwerty'";
        var verifyExpectedResult = [ { col1 : 'qwerty', col2 : '123' } ];

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
        var testSql = "update test.transactionsTable set col2 = '456' where col1 = 'BBB'";
        var testExpectedResult = 1;
        var verifySql = "select col1, col2 from test.transactionsTable where col1 = 'BBB'";
        var verifyExpectedResult = [ { col1 : 'BBB', col2 : '456' } ];

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
        var testSql = "delete test.transactionsTable where col1 = 'CCC'";
        var testExpectedResult = 1;
        var verifySql = "select col1, col2 from test.transactionsTable";
        var verifyExpectedResult = [
          { col1 : 'AAA', col2 : 'ZZZ' },
          { col1 : 'AAA', col2 : 'YYY' },
          { col1 : 'BBB', col2 : 'XXX' }
        ];

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

      /*jshint +W109 */
    });

  }); // describe without connection pooling

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

  describe('with connection pooling', function() {
    // tedious-connection-pool alters the Connection prototype on load
    // and thus it can't be required until the first time we need it.
    // Then, we can't go back to non-pooled connections.
    var ConnectionPool, pool, tp;

    beforeEach(function() {
      if(!ConnectionPool) {
        ConnectionPool = require('tedious-connection-pool');

        var poolConfig = {
            min: 4,
            max: 4,
            log: true
        };
        var connectionConfig = _.cloneDeep(dbConfig);
        pool = new ConnectionPool(poolConfig, connectionConfig);
        tp = new TediousPromises()
          .setConnectionPool(pool);
      }
    });

    it('should acquire and release connections', function(done) {
      var acquireSpy = spyOn(ConnectionPool.prototype, 'acquire').andCallThrough();
      var releaseSpy = spyOn(ConnectionPool.prototype, 'release').andCallThrough();

      tp.sql(simpleTable.selectRow1)
      .execute()
      .then(function() {
        expect(acquireSpy).toHaveBeenCalled();
        expect(releaseSpy).toHaveBeenCalled();
        }).fail(function(err) {
          self.fail(err);
        }).fin(done);
    });
  }); // describe with connection pooling

  describe('with mock callback', function() {

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


  }); // describe with mock callback

}); // describe tedious-promises
