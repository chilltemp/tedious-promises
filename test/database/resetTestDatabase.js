'use strict';
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var dbConfig = require('./config.json');
var fs = require('fs');
var path = require('path');
var q = require('q');
var _ = require('lodash');

function execSql(sql) {
  var deferred = q.defer();
  var config = _.cloneDeep(dbConfig);
  var connection = new Connection(config);

  connection.on('connect', function(err) {
    if(err) {
      deferred.reject(err);
      return;
    }

    var request = new Request(sql, function(err, rowCount) {
      if(err) {
        deferred.reject(err);
        return;
      }

      console.log('Rows: ' + rowCount);
      deferred.resolve();
    });
    request.on('done', function(rowCount, more) {
      console.log(rowCount + ' rows modified');
      if(!more) {
        connection.close();
        deferred.resolve();
      }
    });

    connection.execSql(request);
  });

  return deferred.promise;
}

function execSqlFile(fileName) {
  console.log('Executing sql file: ' + fileName);

  return q.nfcall(fs.readFile, path.join(__dirname, fileName), 'utf-8')
  .then(function(sqlStatements) {
    if(typeof sqlStatements !== 'string') {
      throw new Error('Unable to read SQL file.');
    }

    return execSql(sqlStatements);
  });
}

module.exports.reset = function() {
  var files = [
    'simpleTable.sql',
    'typesTable.sql',
    'booleanTable.sql',
    'transactionsTable.sql',
    'transactionsTableData.sql'
  ];

  // runs execSqlFile on each file, sequentially
  // and returns the chain of promises
  return files.reduce(function(promiseChain, file) {
    return promiseChain.then(function(result) {
      return execSqlFile(file);
    });
  }, q());
};

module.exports.resetTransactionsTableData = function() {
  return execSqlFile('transactionsTableData.sql');
};
