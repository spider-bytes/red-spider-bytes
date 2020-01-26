import { Timestamp } from './timestamp';
import { IMerkle } from './merkle';

export interface IMessagePayload {
    tableName: string;
    column: string;
    rowId: string;
    value: string;
}

export interface IMessage {
    tableName: string;
    column: string;
    rowId: string;
    value: string;
    timestamp: Timestamp;
}

export interface IMessageBody {
    tableName: string;
    column: string;
    rowId: string;
    value: string;
    timestamp: string; // hybrid-logical clock
}

export type IMessageCallback = (msg: IMessagePayload) => void;

export interface IDatabaseConnector {
    setCredentials(credentials: string): Promise<void>;
    createDatabase(userId: string): Promise<string>;
    useDatabase(databaseId: string, groupId: string): Promise<IDatabaseDescription>;

    sync(databaseDescription: IDatabaseDescription): Promise<void>;
    listenForMessages(databaseDescription: IDatabaseDescription, cb: IMessageCallback): Promise<void>;
    storeMessages(databaseDescription: IDatabaseDescription, messagePayloads: IMessagePayload[]): Promise<void>;
}

export type IDatabaseDescription = any; //eslint-disable-line @typescript-eslint/no-explicit-any
export type IDatabaseId = string;


export interface ISyncData {
    groupId?: string;
    clientId?: string;
    messages: IMessageBody[];
    merkle: IMerkle;
}

export interface ISyncResponse {
    status: string;
    reason?: string;
    data: ISyncData;
}