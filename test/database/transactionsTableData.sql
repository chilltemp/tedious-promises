-- This is seporate from the table definition because it is used before every transaction test

DELETE FROM test.transactionsTable;

INSERT INTO test.transactionsTable([col1],[col2]) VALUES('AAA','ZZZ');
INSERT INTO test.transactionsTable([col1],[col2]) VALUES('AAA','YYY');
INSERT INTO test.transactionsTable([col1],[col2]) VALUES('BBB','XXX');
INSERT INTO test.transactionsTable([col1],[col2]) VALUES('CCC','WWW');
