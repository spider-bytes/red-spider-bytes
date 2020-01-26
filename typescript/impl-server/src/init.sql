/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

CREATE TABLE messages (
    timestamp TEXT,
    database_id TEXT,
    group_id TEXT,
    table_name TEXT,
    row TEXT,
    column TEXT,
    value TEXT,
    PRIMARY KEY(timestamp, database_id, group_id)
);

CREATE TABLE messages_merkles (
    database_id TEXT,
    group_id TEXT,
    merkle TEXT,
   PRIMARY KEY(database_id, group_id)
);