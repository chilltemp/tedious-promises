-- Typed after the fact.  There may be typo's or missing commands

use master;
create login tedioustest with password='something random';

use [tedious-promises-e2e-tests];
create user tedioustestuser from login tedioustest;
create schema test;
grant alter, insert, update, delete on schema::test to tedioustestuser;
