-- http://www.generatedata.com

IF EXISTS(SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('[test].[simpleTable]'))
BEGIN;
    DROP TABLE [test].[simpleTable];
END;

CREATE TABLE [test].[simpleTable] (
    [simpleTableID] INTEGER NOT NULL IDENTITY(1, 1),
    [col1] VARCHAR(255) NULL,
    [col2] VARCHAR(255) NULL,
    PRIMARY KEY ([simpleTableID])
);

INSERT INTO test.simpleTable([col1],[col2]) VALUES('Fulton','Kylie');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Maxwell','Sonya');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Macon','Kendall');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Hector','Rowan');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Driscoll','Adrienne');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Vaughan','Cailin');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Ivan','Fallon');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Baxter','Nerea');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Arthur','September');
INSERT INTO test.simpleTable([col1],[col2]) VALUES('Cruz','Sacha');
