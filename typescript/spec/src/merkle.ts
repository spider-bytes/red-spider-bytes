/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import { Timestamp } from './timestamp';

export interface IMerkle {
    hash?: number;
    [key: string]: IMerkle | number;
}

export class Merkle {

    public static getKeys(trie: IMerkle): string[] {
        return Object.keys(trie).filter((x: string) => x !== 'hash');
    }

    public static keyToTimestamp(key: string): number {
        // 16 is the length of the base 3 value of the current time in
        // minutes. Ensure it's padded to create the full value
        const fullKey: string = key + '0'.repeat(16 - key.length);

        // Parse the base 3 representation
        return parseInt(fullKey, 3) * 1000 * 60;
    }

    private static insertKey(trie: IMerkle, key: string, hash: number): IMerkle {
        if (key.length === 0) {
            return trie;
        }
        const c: string = key[0];
        const n: IMerkle = (trie[c] || {}) as IMerkle;
        return Object.assign({}, trie, {
            [c]: Object.assign({}, n, Merkle.insertKey(n, key.slice(1), hash), {
                hash: n.hash ^ hash,
            }),
        });
    }

    public static insert(trie: IMerkle, timestamp: Timestamp): IMerkle {
        const hash: number = timestamp.hash();
        const key: string = Number((timestamp.millis() / 1000 / 60) | 0).toString(3);

        trie = Object.assign({}, trie, { hash: trie.hash ^ hash });
        return Merkle.insertKey(trie, key, hash);
    }

    public static build(timestamps: Timestamp[]): IMerkle {
        const trie: IMerkle = {};
        for (const timestamp of timestamps) {
            Merkle.insert(trie, timestamp);
        }
        return trie;
    }

    public static diff(trie1: IMerkle, trie2: IMerkle): number {
        if (trie1.hash === trie2.hash) {
            return null;
        }

        let node1: IMerkle = trie1;
        let node2: IMerkle = trie2;
        let k: string = '';

        while (1) {
            const keyset: Set<string> = new Set<string>([
                ...Merkle.getKeys(node1),
                ...Merkle.getKeys(node2),
            ]);
            const keys: string[] = [...keyset.values()];
            keys.sort();

            const diffkey: string = keys.find((key: string) => {
                const next1: IMerkle = (node1[key] || {}) as IMerkle;
                const next2: IMerkle = (node2[key] || {}) as IMerkle;
                return next1.hash !== next2.hash;
            });

            if (!diffkey) {
                return Merkle.keyToTimestamp(k);
            }

            k += diffkey;
            node1 = (node1[diffkey] || {}) as IMerkle;
            node2 = (node2[diffkey] || {}) as IMerkle;
        }
    }

    public static prune(trie: IMerkle, n: number = 2): IMerkle {
        // Do nothing if empty
        if (!trie.hash) {
            return trie;
        }

        const keys: string[] = Merkle.getKeys(trie);
        keys.sort();

        const next: IMerkle = { hash: trie.hash };
        keys.slice(-n).forEach((k: string) => (next[k] = Merkle.prune(trie[k] as IMerkle, n)));

        return next;
    }

    public static debug(trie: IMerkle, k: string = '', indent: number = 0): string {
        const str: string =
            ' '.repeat(indent) +
            (k !== '' ? `k: ${k} ` : '') +
            `hash: ${trie.hash || '(empty)'}\n`;
        return (
            str +
            Merkle.getKeys(trie)
                .map((key: string) => {
                    return Merkle.debug(trie[key] as IMerkle, key, indent + 2);
                })
                .join('')
        );
    }

}
