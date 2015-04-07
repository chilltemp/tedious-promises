#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> Wraps Tedious SQL commands with Q promises.
> Uses fluent syntax 

## Install

```sh
$ npm install --save tedious-promises
```


## Usage

Sample: config.json See the Tedious documentation for configuration details.
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

Initialization without connection pooling
```js
var tp = require('tedious-promises');
var dbConfig = require('config.json');
var TYPES = require('tedious').TYPES;
tp.setConnectionConfig(dbConfig);
```

Initialization with connection pooling
```js
TBD
```

Basic usage
```js
tp.sql("SELECT col1, col2 FROM dbo.table")
  .execute()
  .then(function(results) {
    // do something with the results
  }).fail(function(err) {
    // do something with the failure
  }).fin(done);
```

In a function returning the promise, with a parameter
```js
function getData(id) {
  return tp.sql("SELECT col1, col2, FROM table WHERE id_col = @id")
    .parameter('id', TYPES.Int, id)
    .execute();
}
```
## To do
* documentation
* sql generation and/or integration of a LINQ package

## License

MIT © [Charles Hill](chillweb.net)


[npm-image]: https://badge.fury.io/js/tedious-promises.svg
[npm-url]: https://npmjs.org/package/tedious-promises
[travis-image]: https://travis-ci.org/chilltemp/tedious-promises.svg?branch=master
[travis-url]: https://travis-ci.org/chilltemp/tedious-promises
[daviddm-image]: https://david-dm.org/chilltemp/tedious-promises.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/chilltemp/tedious-promises
