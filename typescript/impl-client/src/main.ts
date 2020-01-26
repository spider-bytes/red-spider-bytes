export {
    uuidv4,
    IMessage,
    IDatabaseId,
    IMessageBody,
    IMessagePayload,
    IMessageCallback,
    IDatabaseConnector,
} from '@spider-bytes/red-spec';

export {
    LocalStorageDatabaseConnector,
} from './localstorage-database-connector';

export {
    ServerDatabaseConnector,
} from './server-database-connector';