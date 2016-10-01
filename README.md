#  [![Dependency Status][daviddm-image]][daviddm-url]

> Wraps [Tedious](https://github.com/pekim/tedious) SQL commands with `Q` or `es6` promises.
> Uses fluent syntax 

## Whats new?
* Transaction support (beta)
* Alternate return data formats (see Row Transformers)
* Should support any promise library

## Install

```sh
$ npm install --save tedious-promises
```


## Configure

### Sample: config.json See the Tedious documentation for configuration details.
```json
{
  "userName": "user",
  "password": "pass",
  "server": "server",
  "options": {
    "database": "dbo",
    "encrypt": true,
  }
}
```

### Initialization without connection pooling
```js
var tp = require('tedious-promises');
var dbConfig = require('config.json');
var TYPES = require('tedious').TYPES;
tp.setConnectionConfig(dbConfig); // global scope
```

### Initialization with connection pooling
```js
var tp = require('tedious-promises');
var dbConfig = require('config.json');
var TYPES = require('tedious').TYPES;
var ConnectionPool = require('tedious-connection-pool');
var poolConfig = {}; // see tedious-connection-pool documentation
var pool = new ConnectionPool(poolConfig, dbConfig);
tp.setConnectionPool(pool); // global scope
```

### Configure automatic column renaming
The callback can be any function that accepts a single string parameter, and returns a string.
```js
var _ = require('lodash');
tp.setDefaultColumnRenamer(_.camelCase); // global scope
```


## Use
### Basic usage
```js
tp.sql("SELECT col1, col2 FROM dbo.table")
  .execute()
  .then(function(results) {
    // do something with the results
  }).fail(function(err) {
    // do something with the failure
  });
  
  
results === [{
  col1: 'row 1 col 1',
  col2: 'row 1 col 2'
}, {
  col1: 'row 2 col 1',
  col2: 'row 2 col 2'
}]
```

### Overriding column behavior
```js
tp.sql("SELECT col1, col2, col3, col4 FROM dbo.table")
  .column('col1', 'firstName') // rename column
  .column('col2', 'lastName')
  .column('col3', 'nameParts.first') // create 'nameParts' object with 'first' property
  .column('col4', 'nameParts.last')
  .execute()
  .then(function(results) {
    // do something with the results
  }).fail(function(err) {
    // do something with the failure
  });
```

### Column types conversion
asBoolean can convert from:
* null === null
* Any integer: 0 === false
* strings:
** 'TRUE','T', 'Y', 'YES', '1'
** 'FALSE', 'F', 'N', 'NO', '0'

asDate can convert from:
* null === null
* integer: new Date(value)
* string: Date.parse(value)

```js
tp.sql("SELECT col1, col2 FROM dbo.table")
  .column('col1').asBoolean()
  .column('col2').asDate()
  .execute()
  .then(function(results) {
    // do something with the results
  }).fail(function(err) {
    // do something with the failure
  });
```

### In a function returning the promise, with a parameter
```js
function getData(id) {
  return tp.sql("SELECT col1, col2, FROM table WHERE id_col = @id")
    .parameter('id', TYPES.Int, id)
    .execute();
}
```

### Returning the generated key from an identity column
(Technically, you don't need to use 'as id', but it makes the code easier to read.)
```js
tp.sql("INSERT INTO table (col1, col2) VALUES ('x','y'); SELECT @@identity as id")
  .execute()
  .then(function(results) {
    console.log(results[0].id);
  });
```

### Handeling each row yourself
```js
tp.sql("SELECT * FROM table")
  .forEachRow(function(row) {
    // do something with the row
  })
  .execute()
  .then(function(results) {
    // result is row count 
  }).fail(function(err) {
    // do something with the failure
  });
```

### Return row count instead of data
Only usefull for INSERT, UPDATE, and DELETE statements
```js
tp.sql("insert into table (col1, col2) values('qwerty', '123')" )
  .returnRowCount()
  .execute()
  .then(function(rowCount) {
    // done, you have the modified row count
  }).fail(function(err) {
    // do something with the failure
  });
```

### Row transformers
* 'rowToObject' (default) converts each row into an object where the column names become the keys
```js
[{
  col1: 'row 1 col 1',
  col2: 'row 1 col 2'
}, {
  col1: 'row 2 col 1',
  col2: 'row 2 col 2'
}]
```

* 'rowToArray' converts each row into an array of values
```js
[
  ['row 1 col 1', 'row 1 col 2'], 
  ['row 2 col 1', 'row 2 col 2']
]
```

* You can also pass in a function to do your own row transformation.
```js
function customTransformer(row, getColumnMap) {
  result = []; // Or {}, or anything you'd like

  for (var i = 0; i < row.length; i++) {
    var col = row[i];
    var name = col.metadata.colName;
    
    // The getColumnMap function returns the built in column mappings.  
    // The GetColumnValue function returns the columns value after being 
    // processed by transformers like asBoolean() and asDate().
    // See TediousPromiseColumn.js for other column functions.
    var map = this.GetColumnMap(name);
    var value = map.GetColumnValue(col)
    
    // do something with the column name and value
  }

  return result;
}
```

## Promises
The `execute` function returns a promise (as do the transaction functions).  
By default this is a [Q](https://github.com/kriskowal/q) promise.
es6 promises are also supported out of the box, but you should be able to 
use any promise library by writing a small polyfill.

### es6 Promises
```js
// Set when you initialize TP to make it global
tp.setConnectionPool(poolConfig);
tp.setPromiseLibrary('es6');

// You can also set the promise library on specific sql commands
return tp.sql('SELECT something FROM something')
  .setPromiseLibrary('es6')
  .execute();
```

## Transactions
Transaction support in Tedious has been around for a long time, but it's new to Tedious Promises.  **So consider it beta for now.  It is possible that there will be breaking changes in the future.**
(Initial implemetation by @akanieski)
```js
var trans;

// create the transaction from the a tp instance
tp.beginTransaction()
  .then(function(newTransaction) {
    // remember the transaction, you'll need it later
    trans = newTransaction;

    // use the transaction like a normal tp instance
    // ('return' chains the promises)
    return trans.sql(testSql)
      .returnRowCount()
      .execute();
  })
  .then(function(testResult) {
    // this is the result of executing testSql on the transaction
    // do something with it
    
    // you can execute another sql statement using the same syntax as above
    // i.e. return trans.sql(...

    // when you're done using the transaction, commit it
    return trans.commitTransaction();
  })
  .fail(function(err) {
    // rollback on failures
    return trans.rollbackTransaction();
  })
```

## Mocking for unit tests
Set the global mock function instead of setConnectionConfig or setConnectionPool to intercept all calls to tp.execute()
```js
tp.setMockDataCallback(function(sql, parameters) { 
  if(sql === 'Select...' && parameters.id.value === 123) {
    return data; // an array of the objects you'd normally get back 
  }
  
  return [];
});


parameters === {
  id: {
    name: 'id',
    type: TYPES.Int,
    value: 123,
    options: null
  }
}
```

## Setup end to end testing
1. Create a SQL database either in Azure or locally
 * Sample user setup and permissions are in `test/database/init.sql`
2. Create `test/database/config.json` based upon the sample below 
 * Replace all `REQUIRED` fields with your database credentials
 * This file is git ignored so that it isn't accidently checked in
3. Run `grunt resetTestDatabase` to create the tables and populate test data
4. Run `grunt` to run the tests, or `grunt watch` to run the test on every file change

```json
{
  "userName": "REQUIRED",
  "password": "REQUIRED",
  "server": "REQUIRED",
  "options": {
    "database": "REQUIRED",
    "encrypt": true,
    "debug": {
      "packet": false
    }
  }
}
```

## To do
* documentation
* sql generation and/or integration of a LINQ package
* local unit tests (current tests require a real database)
* more tests for the mock connection
* \[\!\[NPM version\]\[npm-image\]\]\[npm-url\] 
* \[\!\[Build Status\]\[travis-image\]\]\[travis-url\] 

## License

MIT © [Charles Hill](chillweb.net)


[npm-image]: https://badge.fury.io/js/tedious-promises.svg
[npm-url]: https://npmjs.org/package/tedious-promises
[travis-image]: https://travis-ci.org/chilltemp/tedious-promises.svg?branch=master
[travis-url]: https://travis-ci.org/chilltemp/tedious-promises
[daviddm-image]: https://david-dm.org/chilltemp/tedious-promises.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/chilltemp/tedious-promises
