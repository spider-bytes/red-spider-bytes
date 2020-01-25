export interface IMessagePayload {
    groupName: string;
    tableName: string;
    column: string;
    rowId: string;
    value: string;
}

export interface IMessage extends IMessagePayload {
    timestamp: string; // hybrid-logical clock
}

export interface IDatabaseConnector {
    setCredentials(credentials: string): Promise<void>;
    createDatabase(userId: string): Promise<string>;
    getMessages(databaseId: IDatabaseId): Promise<IMessagePayload[]>;
    storeMessages(databaseId: IDatabaseId, messagePayloads: IMessagePayload[]): Promise<IMessagePayload[]>;
}

export type IDatabaseId = string;