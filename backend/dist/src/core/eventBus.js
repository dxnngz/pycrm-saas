import pkg from 'eventemitter2';
const { EventEmitter2 } = pkg;
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
