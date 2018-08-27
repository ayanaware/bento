'use strict';

const { EventEmitter } = require('events');

const EventBus = require('./EventBus');

class AyanaModules {
    constructor() {
        this.primary = new Map();
        this.secondary = new Map();

        this.bus = new EventBus();
    }

    /**
	 * Instantiates and registers all primary and secondary modules.
	 * @param {Object} opts - Module Options
	 * @param {string} opts.primary - Primary modules location
	 * @param {string} opts.secondary - Secondary modules location
	 */
	async init(opts) {
		opts = Object.assign({}, {
			primary: null,
			secondary: null,
		}, opts);

		if (!opts.primary) throw new Error(`'opts.primary' is required.`);

		// load modules
		await this.loadPrimaryModules(opts.primary);
		if (opts.secondary) await this.loadSecondaryModules(opts.secondary);
    }

    /**
	 * Access a primary module
	 * @param {string} name - Primary module name
	 * @returns {Object} - Instantiated module
	 */
	getPrimary(name) {
		if (!this.primary.has(name)) throw new Error(`PrimaryModule '${name}' does not exist!`);
		return this.primary.get(name).instance;
	}

	/**
	 * Access a secondary module, this is an anti-pattern!
	 * If you need to access a secondary module. You should probably just make it a primary module.
	 * @param {string} name - Secondary module name
	 * @returns {Object} - Instantiated module
	 */
	getSecondary(name) {
		if (!this.secondary.has(name)) throw new Error(`SecondaryModule '${name}' does not exist!`);
		return this.secondary.get(name).instance;
    }
    
    /**
	 * Registers module of provided type, also calls onMount on module
	 * @param {Object} instance - Module
	 * @param {string} type - Type of module to register: primary, secondary.
	 * @returns {boolean}
	 */
	async registerModule(instance, type = 'primary') {
        if(!instance) throw new Error(`Cannot register module. 'instance' is required.`);

        // determine type of instnace
        if (typeof instnace === 'function') {
            try {
                instance = new instance();
            } catch(e) {
                try {
                    instance = instance();
                } catch (e2) {
                    throw new Error(`Unable to insantiate module function: ${e2}`);
                } 
            }
        } else if (typeof instance !== 'object') throw new Error(`Module can not be registered. Invalid format`);

        if (!['name'].every(p => instance[p])) throw new Error(`Cannot register module. Missing required metadata`);

		if (data.instance.onMount && typeof data.instance.onMount === 'function') {
			try {
				await data.instance.onMount();
			} catch (e) {
				if (type === 'primary' && data.required) throw new Error(`: ${data.name}(${data.location}) stated it is a required module. ${e}`);
			}
		}

		if (type === 'primary') {
			this.primary.set(data.name, data);
		} else {
			this.secondary.set(data.name, data);
		}

		log.debug(`Registered ${type} module ${data.name}(${data.location})`);
		return true;
	}
}

module.exports = AyanaModules;
