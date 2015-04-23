#  [![Dependency Status][daviddm-image]][daviddm-url]

> Wraps Tedious SQL commands with Q promises.
> Uses fluent syntax 

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
