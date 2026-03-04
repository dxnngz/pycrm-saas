import { EventEmitter2 } from 'eventemitter2';

class EventBus extends EventEmitter2 {
    constructor() {
        super({
            wildcard: true,
            delimiter: '.',
            maxListeners: 50
        });
    }
}

export const eventBus = new EventBus();
