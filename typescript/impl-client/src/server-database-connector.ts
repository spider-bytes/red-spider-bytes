import { IDatabaseConnector, IMessage, IMessageCallback } from '@spider-bytes/red-spec';
import { Sync } from './sync';
import { IMessagePayload } from '@spider-bytes/red-spec/src/types';
import { MessageUtils } from '@spider-bytes/red-spec/src/utils';
import { IClock } from '@spider-bytes/red-spec/src/clock';
import { Timestamp } from '@spider-bytes/red-spec/src/main';

export class ServerDatabaseConnector implements IDatabaseConnector {

    private syncInstance: Sync;
    private messageCb: IMessageCallback = null;
    private databaseId: string;

    constructor(
        private readonly serverUrl: string,
    ) {
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
        // TODO create database in server
        return 'DEMO_DATABASE/' + userId;
    }

    public async useDatabase(databaseId: string, groupId: string) {
        this.databaseId = databaseId;
        this.syncInstance = new Sync(
            this.serverUrl,
            databaseId,
            groupId,
            (msg: IMessage) => this.messageCb && this.messageCb(msg),
        );
    }

    public async sync(): Promise<void> {
        await this.syncInstance.sync();
    }

    public async listenForMessages(messageCb: IMessageCallback): Promise<void> {
        this.messageCb = messageCb;
    }

    public async storeMessages(messagePayloads: IMessagePayload[]): Promise<void> {
        const clock: IClock = this.syncInstance.getClock();

        const messages: IMessage[] = messagePayloads
            .map((msg: IMessagePayload) => MessageUtils.payloadToMessage(msg, Timestamp.send(clock)));

        await this.syncInstance.sendMessages(messages);
    }

}