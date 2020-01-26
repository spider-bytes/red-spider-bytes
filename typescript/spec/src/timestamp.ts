/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import { IClock } from './clock';
import * as murmurhash from 'murmurhash';

const config: { maxDrift: number } = {
    // Maximum physical clock drift allowed, in ms
    maxDrift: 60000,
};

export class TimestampDuplicateNodeError extends Error {

    private readonly type: string;

    constructor(node: string) {
        super();
        this.type = 'DuplicateNodeError';
        this.message = 'duplicate node identifier ' + node;
    }

}

export class TimestampClockDriftError extends Error {

    private readonly type: string;

    constructor(...args: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
        super();
        this.type = 'ClockDriftError';
        this.message = ['maximum clock drift exceeded'].concat(args).join(' ');
    }

}

export class TimestampOverflowError extends Error {

    private readonly type: string;

    constructor() {
        super();
        this.type = 'OverflowError';
        this.message = 'timestamp counter overflow';
    }

}

export class Timestamp {

    constructor(
        protected _millis: number,
        protected _counter: number,
        protected _node: string,
    ) {
    }

    valueOf() {
        return this.toString();
    }

    public toString() {
        return [
            new Date(this.millis()).toISOString(),
            (
                '0000' +
                this.counter()
                    .toString(16)
                    .toUpperCase()
            ).slice(-4),
            ('0000000000000000' + this.node()).slice(-16),
        ].join('-');
    }

    public millis(): number {
        return this._millis;
    }

    public counter(): number {
        return this._counter;
    }

    public node(): string {
        return this._node;
    }

    public hash() {
        return murmurhash.v3(this.toString());
    }


    // Timestamp generator initialization
    // * sets the node ID to an arbitrary value
    // * useful for mocking/unit testing
    public static init(options: { maxDrift?: number } = {}) {
        if (options.maxDrift) {
            config.maxDrift = options.maxDrift;
        }
    }

    /**
     * Timestamp send. Generates a unique, monotonic timestamp suitable
     * for transmission to another system in string format
     */
    public static send(clock: IClock) {
        // Retrieve the local wall time
        const phys: number = Date.now();

        // Unpack the clock.timestamp logical time and counter
        const lOld: number = clock.timestamp.millis();
        const cOld: number = clock.timestamp.counter();

        // Calculate the next logical time and counter
        // * ensure that the logical time never goes backward
        // * increment the counter if phys time does not advance
        const lNew: number = Math.max(lOld, phys);
        const cNew: number = lOld === lNew ? cOld + 1 : 0;

        // Check the result for drift and counter overflow
        if (lNew - phys > config.maxDrift) {
            throw new TimestampClockDriftError(lNew, phys, config.maxDrift);
        }
        if (cNew > 65535) {
            throw new TimestampOverflowError();
        }

        // Repack the logical time/counter
        clock.timestamp.setMillis(lNew);
        clock.timestamp.setCounter(cNew);

        return new Timestamp(
            clock.timestamp.millis(),
            clock.timestamp.counter(),
            clock.timestamp.node(),
        );
    }

    // Timestamp receive. Parses and merges a timestamp from a remote
    // system with the local timeglobal uniqueness and monotonicity are
    // preserved
    public static recv(clock: IClock, msg: Timestamp) {
        const phys: number = Date.now();

        // Unpack the message wall time/counter
        const lMsg: number = msg.millis();
        const cMsg: number = msg.counter();

        // Assert the node id and remote clock drift
        if (msg.node() === clock.timestamp.node()) {
            throw new TimestampDuplicateNodeError(clock.timestamp.node());
        }
        if (lMsg - phys > config.maxDrift) {
            throw new TimestampClockDriftError();
        }

        // Unpack the clock.timestamp logical time and counter
        const lOld: number = clock.timestamp.millis();
        const cOld: number = clock.timestamp.counter();

        // Calculate the next logical time and counter.
        // Ensure that the logical time never goes backward;
        // * if all logical clocks are equal, increment the max counter,
        // * if max = old > message, increment local counter,
        // * if max = messsage > old, increment message counter,
        // * otherwise, clocks are monotonic, reset counter
        const lNew: number = Math.max(Math.max(lOld, phys), lMsg);
        const cNew: number =
            lNew === lOld && lNew === lMsg
                ? Math.max(cOld, cMsg) + 1
                : lNew === lOld
                ? cOld + 1
                : lNew === lMsg
                    ? cMsg + 1
                    : 0;

        // Check the result for drift and counter overflow
        if (lNew - phys > config.maxDrift) {
            throw new TimestampClockDriftError();
        }
        if (cNew > 65535) {
            throw new TimestampOverflowError();
        }

        // Repack the logical time/counter
        clock.timestamp.setMillis(lNew);
        clock.timestamp.setCounter(cNew);

        return new Timestamp(
            clock.timestamp.millis(),
            clock.timestamp.counter(),
            clock.timestamp.node(),
        );
    }

    /**
     * Converts a fixed-length string timestamp to the structured value
     */
    public static parse(timestamp: string): Timestamp {
        if (typeof timestamp === 'string') {
            const parts: string[] = timestamp.split('-');
            if (parts && parts.length === 5) {
                const millis: number = Date.parse(parts.slice(0, 3).join('-')).valueOf();
                const counter: number = parseInt(parts[3], 16);
                const node: string = parts[4];
                if (!isNaN(millis) && !isNaN(counter))
                    return new Timestamp(millis, counter, node);
            }
        }
        return null;
    }

    public static since(isoString: string): string {
        return isoString + '-0000-0000000000000000';
    }


}

export class MutableTimestamp extends Timestamp {

    public setMillis(n: number) {
        this._millis = n;
    }

    public setCounter(n: number) {
        this._counter = n;
    }

    public setNode(n: string) {
        this._node = n;
    }

    public static from(timestamp: Timestamp) {
        return new MutableTimestamp(
            timestamp.millis(),
            timestamp.counter(),
            timestamp.node(),
        );
    }

}