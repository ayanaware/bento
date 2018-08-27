'use strict';

class ModuleAPI {
    constructor(base) {
        this.base = base;
    }

    async emitOn(name, event, ...args) {
        this.base.bus.emitOnBus(name, event, ...args);
    }

    async listenOn(name, event, fn) {
        this.base.bus.listenOnBus(name, event, fn);
    }
}

module.exports = ModuleAPI;
