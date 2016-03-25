IF EXISTS(SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('[test].[transactionsTable]'))
BEGIN;
    DROP TABLE [test].[transactionsTable];
END;

CREATE TABLE [test].[transactionsTable] (
    [transactionsTableID] INTEGER NOT NULL IDENTITY(1, 1),
    [col1] VARCHAR(255) NULL,
    [col2] VARCHAR(255) NULL,
    PRIMARY KEY ([transactionsTableID])
);
