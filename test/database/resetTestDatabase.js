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
      console.log('Rows: ' + rowCount);
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
  console.log('File: ' + fileName);

  return q.nfcall(fs.readFile, path.join(__dirname, fileName), 'utf-8')
  .then(function(sqlStatements) {
    if(typeof sqlStatements !== 'string') {
      throw new Error('Unable to read SQL file.');
    }

    return execSql(sqlStatements);
  });
}

module.exports.reset = function() {
  return execSqlFile('simpleTable.sql')
  .then(function() {
    return execSqlFile('typesTable.sql');
  })
  .then(function() {
    return execSqlFile('booleanTable.sql');
  });
};
