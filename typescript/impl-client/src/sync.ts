/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import { Clock, IClock, makeClientId, Merkle, Timestamp } from '@spider-bytes/red-spec';
import { IMessage, IMessageBody, ISyncData, ISyncResponse } from '@spider-bytes/red-spec/src/types';
import { MessageUtils } from '@spider-bytes/red-spec/src/utils';

export type IOnSyncFunction = () => void;
export type IApplyMessageFunction = (msg: IMessage) => void;

export class Sync {

    private readonly clock: IClock;
    private readonly _messages: IMessageBody[] = [];
    private syncEnabled: boolean = true;

    constructor(
        private readonly serverUrl: string,
        private readonly databaseId: string,
        private readonly groupId: string,
        private readonly applyMessage: IApplyMessageFunction = null,
        private readonly onSync: IOnSyncFunction = null,
    ) {
        this.clock = Clock.makeClock(new Timestamp(0, 0, makeClientId()));
    }

    public getClock(): IClock {
        return this.clock;
    }

    public setSyncingEnabled(flag: boolean) {
        this.syncEnabled = flag;
    }

    async post(data: ISyncData): Promise<ISyncData> {
        const res: Response = await fetch(this.serverUrl + '/sync', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const resData: ISyncResponse = await res.json();

        if (resData.status !== 'ok') {
            throw new Error('API error: ' + resData.reason);
        }
        return resData.data;
    }

    compareMessages(messages: IMessageBody[]): Map<IMessageBody, IMessageBody> {
        const existingMessages: Map<IMessageBody, IMessageBody> = new Map<IMessageBody, IMessageBody>();

        // This could be optimized, but keeping it simple for now. Need to
        // find the latest message that exists for the dataset/row/column
        // for each incoming message, so sort it first

        const sortedMessages: IMessageBody[] = [...this._messages].sort((m1: IMessageBody, m2: IMessageBody) => {
            if (m1.timestamp < m2.timestamp) {
                return 1;
            } else if (m1.timestamp > m2.timestamp) {
                return -1;
            }
            return 0;
        });

        messages.forEach((msg1: IMessageBody) => {
            const existingMsg: IMessageBody = sortedMessages.find(
                (msg2: IMessageBody) =>
                    msg1.tableName === msg2.tableName &&
                    msg1.rowId === msg2.rowId &&
                    msg1.column === msg2.column,
            );

            existingMessages.set(msg1, existingMsg);
        });

        return existingMessages;
    }

    applyMessages(messages: IMessageBody[]) {
        const existingMessages: Map<IMessageBody, IMessageBody> = this.compareMessages(messages);

        messages.forEach((msg: IMessageBody) => {
            const existingMsg: IMessageBody = existingMessages.get(msg);

            if (!existingMsg || existingMsg.timestamp < msg.timestamp) {
                const newMessage: IMessage = MessageUtils.toMessage(msg);
                this.applyMessage && this.applyMessage(newMessage);
            }

            if (!existingMsg || existingMsg.timestamp !== msg.timestamp) {
                this.clock.merkle = Merkle.insert(
                    this.clock.merkle,
                    Timestamp.parse(msg.timestamp),
                );
                this._messages.push(msg);
            }
        });

        this.onSync && this.onSync();
    }

    receiveMessages(messages: IMessageBody[]) {
        messages.map((msg: IMessageBody) => {
            const message: IMessage = MessageUtils.toMessage(msg);
            Timestamp.recv(this.clock, message.timestamp);
            return message;
        });

        this.applyMessages(messages);
    }

    public async sync(initialMessages: IMessageBody[] = [], since: number = null): Promise<void> {
        if (!this.syncEnabled) {
            return;
        }

        let messages: IMessageBody[] = initialMessages;

        if (since) {
            const timestamp: string = new Timestamp(since, 0, '0').toString();
            messages = this._messages.filter((msg: IMessageBody) => msg.timestamp >= timestamp);
        }

        let result: ISyncData;
        try {
            result = await this.post({
                groupId: this.groupId,
                clientId: this.clock.timestamp.node(),
                messages,
                merkle: this.clock.merkle,
            });
        } catch (e) {
            throw new Error('network-failure');
        }

        if (result.messages.length > 0) {
            this.receiveMessages(result.messages);
        }

        const diffTime: number = Merkle.diff(result.merkle, this.clock.merkle);

        if (diffTime) {
            if (since && since === diffTime) {
                throw new Error(
                    'A bug happened while syncing and the client ' +
                    'was unable to get in sync with the server. ' +
                    'This is an internal error that shouldn\'t happen',
                );
            }

            this.sync([], diffTime);
        }
    }

    public async sendMessages(messages: IMessage[]) {
        const messageArr: IMessageBody[] = messages
            .map((msg: IMessage) => MessageUtils.toMessageBody(msg));

        this.applyMessages(messageArr);
        await this.sync(messageArr);
    }

}
