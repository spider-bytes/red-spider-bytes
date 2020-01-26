/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

CREATE TABLE messages
  (timestamp TEXT,
   group_id TEXT,
   table_name TEXT,
   row TEXT,
   column TEXT,
   value TEXT,
   PRIMARY KEY(timestamp, group_id));

CREATE TABLE messages_merkles
  (group_id TEXT PRIMARY KEY,
   merkle TEXT);