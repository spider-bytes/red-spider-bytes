import {
    Clock,
    IClock,
    IDatabaseConnector,
    IMessage,
    IMessageBody,
    IMessageCallback,
    IMessagePayload,
    makeClientId,
    MessageUtils,
    Timestamp,
} from '@spider-bytes/red-spec';

declare const localStorage: any; // eslint-disable-line @typescript-eslint/no-explicit-any

export class LocalStorageDatabaseConnector implements IDatabaseConnector {

    private readonly clock: IClock;
    private databaseId: string;
    private groupId: string;

    constructor() {
        this.clock = Clock.makeClock(new Timestamp(0, 0, makeClientId()));
    }

    public async setCredentials(): Promise<void> {
        /*
        * no credentials needed in the current version
        * storage solutions:
        * - (not yet implemented) json file on local file system (node only)
        * - json in localStorage of browser (browser only)
        * */
    }

    public async createDatabase(userId: string): Promise<string> {
        const databaseId: string = 'database.' + userId;
        localStorage.setItem(databaseId + '.domainData', '[]');
        localStorage.setItem(databaseId + '.accessList', '[]');
        return databaseId;
    }

    public async useDatabase(databaseId: string, groupId: string): Promise<void> {
        this.databaseId = databaseId;
        this.groupId = groupId;
    }

    private getDatabaseGroupId(): string {
        return this.databaseId + '.' + this.groupId;
    }

    public async sync(): Promise<void> {
        // no implementation because there are no new messages from other clients
    }

    public async listenForMessages(messageCb: IMessageCallback): Promise<void> {
        const messages: IMessageBody[] = this.getMessages();
        messages && messages
            .map((msg: IMessageBody) => MessageUtils.toMessage(msg))
            .forEach((msg: IMessage) => {
                Timestamp.recv(this.clock, msg.timestamp);
                messageCb(msg);
            });
    }

    private getMessages() {
        const databaseGroupId: string = this.getDatabaseGroupId();
        if (this.databaseId && this.groupId) {
            const messagesJson: string = localStorage.getItem(databaseGroupId);
            if (messagesJson) {
                const messages: IMessageBody[] = JSON.parse(messagesJson);
                if (messages) {
                    return messages;
                }
            }
        }

        throw { msg: `Database with id '${databaseGroupId}' not found.` };
    }

    public async storeMessages(newMessages: IMessagePayload[]): Promise<void> {
        const newMessageBodies: IMessageBody[] = newMessages
            .map((msg: IMessagePayload) => MessageUtils.payloadToMessage(msg, Timestamp.send(this.clock)))
            .map((msg: IMessage) => MessageUtils.toMessageBody(msg));

        const messages: IMessageBody[] = await this.getMessages();
        messages.push(...(newMessageBodies));
        const messagesJson: string = JSON.stringify(messages);

        localStorage.setItem(this.getDatabaseGroupId(), messagesJson);
    }

}