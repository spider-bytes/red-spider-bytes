/*
* Thanks to jlongster, copied file from https://github.com/jlongster/crdt-example-app
* File was modified file to be TypeScript compatible
* */

import { uuid as uuidv4 } from 'uuidv4';

export function makeClientId(): string {
    return uuidv4()
        .replace(/-/g, '')
        .slice(-16);
}