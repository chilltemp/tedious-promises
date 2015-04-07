'use strict';
var chalk = require('chalk');
var TYPES = require('tedious').TYPES;
var tediousPromises = require('../src');
var TediousPromises = tediousPromises.TediousPromises;
var _ = require('lodash');
var q = require('q');

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

      tp.sql(simpleTable.selectRows1to10)
        .forEachRow(function(row) {
          expect(row).toEqual(simpleTable.data[cnt++]);
        })
        .execute()
        .then(function(results) {
          // should be called, but the parameter should be undefined
          expect(results).toBeUndefined();
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



  }); // describe without connection pooling

  describe('with bad configuration', function() {

    it('should require either pool or config', function() {
      var tp = new TediousPromises();

      try {
        tp.sql(simpleTable.selectRow1);
        self.fail('should be unreachable');
      } catch(e) {
        expect(e instanceof Error).toEqual(true);
        expect(e.message).toMatch(/config/);
        expect(e.message).toMatch(/pool/);
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
console.log('INIT POOL');
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

}); // describe tedious-promises
