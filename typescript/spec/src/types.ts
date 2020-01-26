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
    useDatabase(databaseId: string, groupId: string): Promise<void>;

    sync(): Promise<void>;
    listenForMessages(cb: IMessageCallback): Promise<void>;
    storeMessages(messagePayloads: IMessagePayload[]): Promise<void>;
}

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