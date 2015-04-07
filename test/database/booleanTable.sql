IF EXISTS(SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('[test].[booleanTable]'))
BEGIN;
    DROP TABLE [test].[booleanTable];
END;

CREATE TABLE [test].[booleanTable] (
    [booleanTableID] INTEGER NOT NULL IDENTITY(1, 1),
    [strings] VARCHAR(255) NULL,
    [numbers] INTEGER NULL,
    PRIMARY KEY ([booleanTableID])
);

INSERT INTO test.booleanTable([strings],[numbers]) VALUES('True',1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('TRUE',1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('TRUE',1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('T',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('t',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('False',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('FALSE',-1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('false',-1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('F',-1);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('f',-9999);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('Yes',-9999);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('YES',-9999);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('Y',9999);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('No',9999);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('NO',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('no',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('N',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('n',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('0',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES('1',0);
INSERT INTO test.booleanTable([strings],[numbers]) VALUES(null,null);

