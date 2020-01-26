import { IDatabaseConnector, IMessagePayload } from '@spider-bytes/red-spec';

declare const localStorage: any; // eslint-disable-line @typescript-eslint/no-explicit-any

export class DatabaseConnector implements IDatabaseConnector {

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

        const emptyJson: string = '[]';
        localStorage.setItem(databaseId, emptyJson);

        return databaseId;
    }

    public async getMessages(databaseId: string): Promise<IMessagePayload[]> {
        const messagesJson: string = localStorage.getItem(databaseId);
        if (messagesJson) {
            const messages: IMessagePayload[] = JSON.parse(messagesJson);
            if (messages) {
                return messages;
            }
        }

        throw { msg: `Database with id '${databaseId}' not found.` };
    }

    public async storeMessages(
        databaseId: string,
        messagePayloads: IMessagePayload[]): Promise<IMessagePayload[]> {

        const messages: IMessagePayload[] = await this.getMessages(databaseId);
        messages.push(...messagePayloads);
        const messagesJson: string = JSON.stringify(messages);
        localStorage.setItem(databaseId, messagesJson);

        return messages;
    }

}