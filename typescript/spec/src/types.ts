export interface MessagePayload {
    groupName: string;
    tableName: string;
    column: string;
    rowId: string;
    value: string;
}

export interface Message extends MessagePayload {
    timestamp: string; // hybrid-logical clock
}

export interface DatabaseConnector {
    setCredentials(credentials: string): Promise<void>;
    createDatabase(userId: string): Promise<string>;
    getMessages(databaseId: DatabaseId): Promise<MessagePayload[]>;
    storeMessages(databaseId: DatabaseId, messagePayloads: MessagePayload[]): Promise<MessagePayload[]>;
}

export type DatabaseId = string;