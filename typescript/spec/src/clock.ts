/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import { MutableTimestamp, Timestamp } from './timestamp';
import { IMerkle } from './merkle';

export interface IClock {
    timestamp: MutableTimestamp;
    merkle: IMerkle;
}

export class Clock {

    public static makeClock(timestamp: Timestamp, merkle: IMerkle = {}): IClock {
        return { timestamp: MutableTimestamp.from(timestamp), merkle };
    }

    public static serializeClock(clock: IClock): string {
        return JSON.stringify({
            timestamp: clock.timestamp.toString(),
            merkle: clock.merkle,
        });
    }

    public static deserializeClock(clock: string): IClock {
        const data: { timestamp: string; merkle: IMerkle } = JSON.parse(clock);
        return {
            timestamp: MutableTimestamp.from(Timestamp.parse(data.timestamp)),
            merkle: data.merkle,
        };
    }

}
