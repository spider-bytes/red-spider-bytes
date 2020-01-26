import { IDatabaseConnector, IMessage, IMessageCallback } from '@spider-bytes/red-spec';
import { Sync } from './sync';
import { IDatabaseDescription, IMessagePayload } from '@spider-bytes/red-spec/src/types';
import { MessageUtils } from '@spider-bytes/red-spec/src/utils';
import { IClock } from '@spider-bytes/red-spec/src/clock';
import { Timestamp } from '@spider-bytes/red-spec/src/main';

export class ServerDatabaseConnector implements IDatabaseConnector {

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
        return 'DEMO_DATABASE:' + userId;
    }

    private getSyncInstance(databaseDescription: IDatabaseDescription): Sync {
        return databaseDescription.sync;
    }

    private getMessageCb(databaseDescription: IDatabaseDescription): IMessageCallback {
        return databaseDescription.messageCb;
    }

    public async useDatabase(databaseId: string, groupId: string): Promise<IDatabaseDescription> {
        const databaseDescription: IDatabaseDescription = { sync: null };
        databaseDescription.sync = new Sync(
            this.serverUrl,
            databaseId,
            groupId,
            (msg: IMessage) => {
                const messageCb: IMessageCallback = this.getMessageCb(databaseDescription);
                messageCb && messageCb(msg);
            },
        );
        return databaseDescription;
    }

    public async sync(databaseDescription: IDatabaseDescription): Promise<void> {
        await this.getSyncInstance(databaseDescription).sync();
    }

    public async listenForMessages(databaseDescription: IDatabaseDescription, messageCb: IMessageCallback): Promise<void> {
        databaseDescription.messageCb = messageCb;
    }

    public async storeMessages(databaseDescription: IDatabaseDescription, messagePayloads: IMessagePayload[]): Promise<void> {
        const clock: IClock = this.getSyncInstance(databaseDescription).getClock();

        const messages: IMessage[] = messagePayloads
            .map((msg: IMessagePayload) => MessageUtils.payloadToMessage(msg, Timestamp.send(clock)));

        await this.getSyncInstance(databaseDescription).sendMessages(messages);
    }

}