/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import fs from 'fs';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import sqlite3, { Database as IDatabase, RunResult, Statement } from 'better-sqlite3';
import { IMerkle, Merkle, Timestamp } from '@spider-bytes/red-spec';


const db: IDatabase = new sqlite3(__dirname + '/db.sqlite');
const message: string[] = db.prepare(`SELECT name FROM sqlite_master WHERE type='table';`).all();
if (message.length <= 0) {
    console.log(`Executing 'init.sql'`);
    const initScript: string = fs.readFileSync(__dirname + '/init.sql', { encoding: 'utf8' });
    const stmtArr: string[] = initScript.split(';');
    stmtArr
        .filter((str: string) => str && str.length > 0)
        .map((stmt: string) => stmt.replace(/\n/g, '') + ';')
        .forEach((stmt: string) => db.prepare(stmt).run());
} else {
    console.log(`Using existing database file`);
}

const app: Application = express();
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

function queryAll<T>(sql: string, params: any[] = []): T[] { //eslint-disable-line @typescript-eslint/no-explicit-any
    const stmt: Statement = db.prepare(sql);
    return stmt.all(...params);
}

function queryRun(sql: string, params: any[] = []): RunResult {//eslint-disable-line @typescript-eslint/no-explicit-any
    const stmt: Statement = db.prepare(sql);
    return stmt.run(...params);
}

function serializeValue(value: any): string { //eslint-disable-line @typescript-eslint/no-explicit-any
    if (value === null) {
        return '0:';
    } else if (typeof value === 'number') {
        return 'N:' + value;
    } else if (typeof value === 'string') {
        return 'S:' + value;
    }

    throw new Error('Unserializable value type: ' + JSON.stringify(value));
}

function deserializeValue(value: string): any { //eslint-disable-line @typescript-eslint/no-explicit-any
    const type: string = value[0];
    switch (type) {
        case '0':
            return null;
        case 'N':
            return parseFloat(value.slice(2));
        case 'S':
            return value.slice(2);
    }

    throw new Error('Invalid type key for value: ' + value);
}

function getMerkle(groupId: string): IMerkle {
    const rows: IMerkleEntity[] = queryAll('SELECT * FROM messages_merkles WHERE group_id = ?', [
        groupId,
    ]);

    if (rows.length > 0) {
        return JSON.parse(rows[0].merkle);
    } else {
        // No merkle trie exists yet (first sync of the app), so create a
        // default one.
        return {};
    }
}

export interface IMessageBody {
    tableName: string;
    rowId: string;
    column: string;
    value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    timestamp: string;
}

export interface IMerkleEntity {
    group_id: string;
    merkle: string;
}

export interface IMessageEntity {
    timestamp: string;
    group_id: string;
    table_name: string;
    row_id: string;
    column: string;
    value: string;
}

function addMessages(groupId: string, messages: IMessageBody[]): IMerkle {
    let trie: IMerkle = getMerkle(groupId);

    queryRun('BEGIN');

    try {
        for (const message of messages) {
            const tableName: string = message.tableName;
            const rowId: string = message.rowId;
            const column: string = message.column;
            const value: string = message.value;
            const timestamp: string = message.timestamp;

            const res: RunResult = queryRun(
                    `INSERT OR IGNORE INTO messages (timestamp, group_id, table_name, row, column, value) VALUES
           (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
                [timestamp, groupId, tableName, rowId, column, serializeValue(value)],
            );

            if (res.changes === 1) {
                // Update the merkle trie
                trie = Merkle.insert(trie, Timestamp.parse(message.timestamp));
            }
        }

        queryRun(
            'INSERT OR REPLACE INTO messages_merkles (group_id, merkle) VALUES (?, ?)',
            [groupId, JSON.stringify(trie)],
        );
        queryRun('COMMIT');
    } catch (e) {
        queryRun('ROLLBACK');
        throw e;
    }

    return trie;
}

app.post('/sync', (req: Request, res: Response) => {
    const groupId: string = req.body.group_id;
    const clientId: string = req.body.client_id;
    const messages: IMessageBody[] = req.body.messages;
    const clientMerkle: IMerkle = req.body.merkle;

    const trie: IMerkle = addMessages(groupId, messages);

    let newMessages: IMessageBody[] = [];
    if (clientMerkle) {
        const diffTime: number = Merkle.diff(trie, clientMerkle);
        if (diffTime) {
            const timestamp: string = new Timestamp(diffTime, 0, '0').toString();
            const newMessageEntities: IMessageEntity[] = queryAll(
                    `SELECT * FROM messages WHERE group_id = ? AND timestamp > ? AND timestamp NOT LIKE '%' || ? ORDER BY timestamp`,
                [groupId, timestamp, clientId],
            );
            newMessages = newMessageEntities.map((msg: IMessageEntity) => {
                const messageBody: IMessageBody = {
                    rowId: msg.row_id,
                    column: msg.column,
                    timestamp: msg.timestamp,
                    tableName: msg.table_name,
                    value: deserializeValue(msg.value),
                };
                return messageBody;
            });
        }
    }

    res.send(
        JSON.stringify({
            status: 'ok',
            data: { messages: newMessages, merkle: trie },
        }),
    );
});

app.get('/ping', (req: Request, res: Response) => {
    res.send('ok');
});

const port: number = 8006;
console.log(`Starting server on port ${port}...`);
app.listen(port, () => console.log(`Started server on port ${port}`));