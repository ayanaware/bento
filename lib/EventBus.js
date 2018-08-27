'use strict';

const { EventEmitter } = require('events');

/**
 * Global and named bus controller
 */
class EventBus {
    constructor() {
        this.bus = new EventEmitter();
        
        this.namedBuses = new Map();
    }

    /**
     * Emit a event on the global bus
     * @param {String} event - name of event to emit
     * @param {Array} args - array of args
     */
    async emit(event, ...args) {
        this.bus.emit(event, ...args);
    }

    /**
     * Creates a new named bus
     * @param {String} name - name of new bus 
     */
    async createNamedBus(name) {
        if (this.namedBuses.has(name)) throw new Error(`A bus by that name already exists.`);

        const bus = new EventEmitter();
        this.namedBuses.set(bus);

        return bus;
    }

    /**
     * Deletes a named bus
     * @param {String} name - name of bus to delete
     */
    async deleteNamedBus(name) {
        if (!this.namedBuses.has(name)) throw new Error(`A bus by that name does not exist.`);
        this.namedBuses.delete(bus);

        return true;
    }

    /**
     * Emit event on a named bus
     * @param {String} name - name of bus 
     * @param {String} event - event to emit
     * @param {Array} args - array of args
     */
    async emitOnBus(name, event, ...args) {
        if (!this.namedBuses.has(name)) throw new Error(`A bus by that name does not exist.`);
        const bus = this.namedBuses.get(name);

        bus.emit(name, event, ...args);

        return true;
    }

    /**
     * Adds a listen on a named bus
     * @param {String} name - name of bus
     * @param {String} event - event to listen for
     * @param {Function} fn - function to call
     */
    async listenOnBus(name, event, fn) {
        if (!this.namedBuses.has(name)) throw new Error(`A bus by that name does not exist.`);
        const bus = this.namedBuses.get(name);

        bus.on(event, (...args) => fn(...args));
    }
}

module.exports = EventBus;
