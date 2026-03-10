import pkg from 'eventemitter2';
const { EventEmitter2 } = pkg as any;
import { logger } from '../utils/logger.js';

export const events = new EventEmitter2({
    wildcard: true,
    delimiter: ':',
    newListener: false,
    maxListeners: 20,
    verboseMemoryLeak: true
});

// Global logger for events in development
if (process.env.NODE_ENV === 'development') {
    events.on('*', function (this: any, data: any) {
        logger.debug({ event: this.event, data }, 'Internal Event Fired');
    });
}
