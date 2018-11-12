'use strict';

import * as crypto from 'crypto';

import { IllegalArgumentError } from '@ayana/errors';
import Logger from '@ayana/logger';

import { Symbols } from './constants/internal';
import { ComponentRegistrationError, PluginRegistrationError } from './errors';
import { ComponentAPI } from './helpers/ComponentAPI';
import { ComponentEvents } from './helpers/ComponentEvents';
import { Plugin, PrimaryComponent, SecondaryComponent } from './interfaces';
import { DecoratorSubscription } from './interfaces/internal';

export interface BentoOptions { }

/**
 * @ignore
 */
const log = Logger.get('Bento');

export class Bento {
	public readonly variables: Map<string, any>;

	public readonly plugins: Map<string, Plugin>;

	public readonly primary: Map<string, PrimaryComponent>;
	public readonly secondary: Map<string, SecondaryComponent>;

	private readonly pending: Map<string, PrimaryComponent>;

	public readonly events: Map<string, ComponentEvents>;

	public readonly opts: BentoOptions;

	constructor(opts?: BentoOptions) {
		this.opts = opts;

		this.variables = new Map();
		this.plugins = new Map();

		this.primary = new Map();
		this.secondary = new Map();

		this.pending = new Map();

		this.events = new Map();
	}

	/**
	 * Generates a uniqueID
	 * @param len - length of id
	 */
	public createID(len: number = 16) {
		return crypto.randomBytes(len)
			.toString('base64')
			.replace(/[^a-z0-9]/gi, '')
			.slice(0, len);
	}

	public getVariable(key: string) {
		if (!this.variables.has(key)) return null;
		return this.variables.get(key);
	}

	public setVariable(key: string, value: any) {
		this.variables.set(key, value);
	}

	/**
	 * Add a Plugin to Bento
	 * @param plugin - Plugin
	 */
	public async addPlugin(plugin: Plugin) {
		if (!plugin.name) throw new PluginRegistrationError(plugin, 'Plugins must specify a name');
		if (this.plugins.has(plugin.name)) throw new PluginRegistrationError(plugin, 'Plugin names must be unique');

		await this.registerPlugin(plugin);

		return plugin.name;
	}

	/**
	 * Remove a Plugin from Bento
	 * @param name - Name of plugin
	 */
	public async removePlugin(name: string) {
		const plugin = this.plugins.get(name);
		if (!plugin) throw new Error(`Plugin '${name}' is not currently attached`);

		// call onUnload
		if (plugin.onUnload) {
			try {
				await plugin.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	/**
	 * Adds plugins to Bento in order of array
	 * @param plugins - Array of Plugins
	 */
	public async addPlugins(plugins: Plugin[]) {
		if (!Array.isArray(plugins)) throw new IllegalArgumentError('addPlugins only accepts an array.');

		const results = [];
		for (const plugin of plugins) {
			const name = await this.addPlugin(plugin);
			results.push(name);
		}

		return results;
	}

	private async registerPlugin(plugin: Plugin) {
		Object.defineProperty(plugin, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: plugin.name,
		});

		// Define bento instance
		Object.defineProperty(plugin, 'bento', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: this,
		});

		// call onLoad
		if (plugin.onLoad) {
			await plugin.onLoad();
		}

		this.plugins.set(plugin.name, plugin);
		return plugin.name;
	}

	/**
	 * Add a Primary Component to Bento
	 * @param component - Primary Component
	 */
	public async addPrimaryComponent(component: PrimaryComponent): Promise<string> {
		if (!component.name) throw new ComponentRegistrationError(component, `Primary components must specify a name`);
		if (this.primary.has(component.name)) throw new ComponentRegistrationError(component, `Primary component names must be unique`);

		// Check variables
		if (component.variables != null && !Array.isArray(component.variables)) {
			throw new ComponentRegistrationError(component, 'Component variables is not an array');
		}

		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, 'Component dependencies is not an array');
		}

		if (!component.dependencies || component.dependencies.length === 0) {
			// Zero dependency primary component, insta-load
			const success = await this.registerPrimaryComponent(component);

			// If any pending components attempt to handle them now
			if (success && this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// determine dependencies
			const missing = this.getMissingDependencies(component);
			if (missing.length === 0) {
				// All dependencies are already loaded
				const success = await this.registerPrimaryComponent(component);

				// if any pending components attempt to handle them now
				if (success && this.pending.size > 0) await this.handlePendingComponents();
			} else {
				// not able to load this component yet :c
				this.pending.set(component.name, component);
			}
		}

		return component.name;
	}

	/**
	 * Remove a Primary Component from Bento
	 * @param name - Name of primary component
	 */
	public async removePrimaryComponent(name: string) {
		const component = this.primary.get(name);
		if (!component) throw new Error(`Primary Component '${name}' is not currently loaded.`);

		// TODO: check if required, required components can't be unloaded

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async registerPrimaryComponent(component: PrimaryComponent): Promise<boolean> {
		// Primary component name (existence was checked before)
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.name,
		});

		Object.defineProperty(component, 'variables', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.variables || [],
		});

		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies || [],
		});

		// Define __primary
		Object.defineProperty(component, '__primary', {
			configurable: false,
			writable: false,
			enumerable: false,
			value: true,
		});

		// Create components' api
		const api = new ComponentAPI(this, component.name);

		// handle component variables
		api.addDefinitions(component.variables);

		// Define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		});

		// Create primary component event helper if it doesn't already exist
		if (!this.events.has(component.name)) {
			const events = new ComponentEvents(component.name);
			this.events.set(component.name, events);
		}

		// Subscribe to all the events from the decorator subscriptions
		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				throw new ComponentRegistrationError(component, `Primary component '${component.name}' failed loading`).setCause(e);
			}
		}

		this.primary.set(component.name, component);

		return true;
	}

	private getMissingDependencies(component: PrimaryComponent): string[] {
		if (!component.dependencies) return [];

		return component.dependencies.reduce((a, depend) => {
			if (!this.primary.has(depend)) a.push(depend);

			return a;
		}, []);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		for (const component of this.pending.values()) {
			const missing = await this.getMissingDependencies(component);
			if (missing.length === 0) {
				this.pending.delete(component.name);

				const success = await this.registerPrimaryComponent(component);
				if (success) loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}

	/**
	 * Add a Secondary Component to Bento
	 * @param component - Secondary Component
	 */
	public async addSecondaryComponent(component: SecondaryComponent) {
		// Check variables
		if (component.variables != null && !Array.isArray(component.variables)) {
			throw new ComponentRegistrationError(component, 'Component variables is not an array');
		}

		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, 'Component dependencies is not an array');
		}

		// TODO Add check if pending components are still there
		// TODO Also add explicit depends to secondary components and check them
		await this.registerSecondaryComponent(component);

		return component.name;
	}

	/**
	 * Remove a Secondary Component from Bento
	 * @param id - Generated ID from addSecondaryComponent
	 */
	public async removeSecondaryComponent(id: string) {
		const component = this.secondary.get(id);
		if (!component) throw new Error(`Component '${id}' is not currently loaded.`);

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}
	}

	private async registerSecondaryComponent(component: SecondaryComponent) {
		// generate uniqueID (name)
		const name = this.createID();

		// apply it to component
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: name,
		});

		Object.defineProperty(component, 'variables', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.variables || [],
		});

		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies || [],
		});

		const api = new ComponentAPI(this, name);

		// handle component variables
		api.addDefinitions(component.variables);

		// define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		});

		// call onLoad
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				throw new ComponentRegistrationError(component, `Secondary component '${component.name}' failed loading`).setCause(e);
			}
		}

		this.secondary.set(name, component);
		return true;
	}
}

export interface Bento {
	on(event: 'error', listener: (error: Error) => void): this;
}
