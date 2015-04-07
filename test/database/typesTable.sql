-- http://www.generatedata.com

IF EXISTS(SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('[test].[typesTable]'))
BEGIN;
    DROP TABLE [test].[typesTable];
END;

CREATE TABLE [test].[typesTable] (
    [typesTableID] INTEGER NOT NULL IDENTITY(1, 1),
    [strings] VARCHAR(255) NULL,
    [dates] DATETIME NULL,
    [numbers] INTEGER NULL,
    [guids] UNIQUEIDENTIFIER NULL,
    PRIMARY KEY ([typesTableID])
);

INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Josiah',CONVERT(datetime,'2015-10-22T15:41:27',126),961,'D2E327BF-712F-31F2-60BF-7FA0BDC19342');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Wynne',CONVERT(datetime,'2015-02-13T20:45:16',126),115,'133071CF-8397-8E10-0731-B853C801A21B');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Camilla',CONVERT(datetime,'2014-08-23T07:13:05',126),346,'511AF1CD-7B7B-30CB-145D-D607CCDFC7BA');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Marvin',CONVERT(datetime,'2014-10-28T03:53:12',126),172,'B83A4D54-5186-5B7C-86DA-4B72919225F4');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Lamar',CONVERT(datetime,'2014-09-21T00:04:31',126),958,'C5F28DE3-89AC-7875-FA69-16287A5F0CE3');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Laith',CONVERT(datetime,'2016-02-07T18:30:12',126),52,'B212F46C-1A7B-620B-1C4B-21BCF7FE6277');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Colette',CONVERT(datetime,'2015-11-07T16:39:42',126),112,'ED329ADB-4E6F-7204-0658-1A57C353987B');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Claire',CONVERT(datetime,'2014-04-03T14:18:54',126),592,'E0E8F00E-0FF9-98A2-8C83-40E41250CFED');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Jameson',CONVERT(datetime,'2016-02-13T11:11:15',126),90,'846A9135-94B9-82A3-96D5-C10BCAA15B3C');
INSERT INTO test.typesTable([strings],[dates],[numbers],[guids]) VALUES('Aileen',CONVERT(datetime,'2015-01-08T07:29:43',126),91,'AC4B9C83-7555-B543-F389-8D6FF056A48D');
