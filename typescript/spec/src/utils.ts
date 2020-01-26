import { IMessage, IMessageBody, IMessagePayload } from './types';
import { Timestamp } from './timestamp';

export class MessageUtils {

    public static toMessageBody(msg: IMessage): IMessageBody {
        return Object.assign(
            {},
            msg,
            { timestamp: msg.timestamp.toString() },
        );
    }

    public static toMessage(msg: IMessageBody): IMessage {
        return Object.assign(
            {},
            msg,
            { timestamp: Timestamp.parse(msg.timestamp) },
        );
    }

    public static payloadToMessage(msg: IMessagePayload, timestamp: Timestamp): IMessage {
        return Object.assign(
            {},
            msg,
            { timestamp },
        );
    }

}