'use strict';

import * as crypto from 'crypto';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';
import Logger from '@ayana/logger';

import { Symbols } from './constants/internal';
import { ComponentRegistrationError, PluginRegistrationError, ValidatorRegistrationError } from './errors';
import { ComponentAPI } from './helpers/ComponentAPI';
import { ComponentEvents } from './helpers/ComponentEvents';
import { Plugin, PrimaryComponent, SecondaryComponent } from './interfaces';
import { DecoratorSubscription, DecoratorVariable } from './interfaces/internal';

export interface BentoOptions {}

export interface SetProperties {
	[key: string]: any;
}

/**
 * @ignore
 */
const log = Logger.get('Bento');

enum ComponentType {
	Primary = 'primary',
	Secondary = 'secondary',
}

export class Bento {
	/**
	 * Runtime Application properties (static) (ex: name, version, time started)
	 */
	public readonly properties: Map<string, any> = new Map();

	/**
	 * Runtime component variables (dynamic)
	 */
	public readonly variables: Map<string, any> = new Map();

	/**
	 * Currently loaded validators
	 */
	public readonly validators: Map<string, (value: any, ...args: any[]) => boolean> = new Map();

	/**
	 * Currently loaded Bento plugins
	 */
	public readonly plugins: Map<string, Plugin> = new Map();

	/**
	 * Currently loaded Primary components
	 */
	public readonly primary: Map<string, PrimaryComponent> = new Map();
	private readonly primaryConstructors: Map<any, string> = new Map();

	/**
	 * Currently loaded Secondary components
	 */
	public readonly secondary: Map<string, SecondaryComponent> = new Map();

	/**
	 * Primary components currently pending to be loaded
	 */
	private readonly pending: Map<string, PrimaryComponent> = new Map();

	/**
	 * @ignore
	 */
	public readonly events: Map<string, ComponentEvents> = new Map();

	/**
	 * @ignore
	 */
	public readonly opts: BentoOptions;

	constructor(opts?: BentoOptions) {
		this.opts = opts;
	}

	/**
	 * Checks whether a component is a primary component or not
	 *
	 * @param component The component that should be checked
	 * @returns true if the given component is a primary component, false if otherwise
	 */
	public static isPrimary(component: PrimaryComponent | SecondaryComponent): boolean {
		return Boolean((component as any)[Symbols.primary]);
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

	/**
	 * Update a given application property value
	 * @param name -name of variable to update
	 * @param value - new value
	 */
	public setProperty(name: string, value: any) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');
		this.properties.set(name, value);
	}

	/**
	 * Fetch a value for given application property
	 * @param name - name of variable to get
	 */
	public getProperty(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Property name must be a string');
		if (!this.properties.has(name)) return null;
		return this.properties.get(name);
	}

	/**
	 * Define multiple application properties at once
	 * @param properties - SetProperties object
	 */
	public setProperties(properties: SetProperties) {
		for (const [name, value] of Object.entries(properties)) {
			this.setProperty(name, value);
		}
	}

	/**
	 * Check if a given variable exists
	 * @param name - name of variable to get
	 */
	public hasVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) return true;
		return false;
	}

	/**
	 * Update a given variables value
	 * @param name - name of variable to update
	 * @param value - new value
	 */
	public setVariable(name: string, value: any) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		this.variables.set(name, value);
	}

	/**
	 * Fetch a value for given variable name
	 * @param name - name of variable to get
	 */
	public getVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (!this.variables.has(name)) return null;
		return this.variables.get(name);
	}

	/**
	 * Add a new validator into Bento
	 * @param name - validator name
	 * @param validator - validator function
	 */
	public addValidator(name: string, validator: (value: any, ...args: any[]) => boolean) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (typeof validator !== 'function') throw new IllegalArgumentError('Validator must be a function');

		this.validators.set(name, validator);
	}

	/**
	 * Remove validator from Bento
	 * @param name - validator name
	 */
	public removeValidator(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		this.validators.delete(name);
	}

	/**
	 * Run a validator
	 * @param name - validator name
	 * @param args - array of args to be passed
	 */
	public runValidator(name: string, ...args: any[]) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Validator name must be a string');
		if (!this.validators.has(name)) throw new IllegalStateError(`Validator "${name}" does not exist`);

		const validator = this.validators.get(name);

		try {
			return validator.call(undefined, ...args);
		} catch (e) {
			throw new ValidatorRegistrationError(name, `Validator "${name}" failed to execute`).setCause(e);
		}
	}

	/**
	 * Add a Plugin to Bento
	 * @param plugin - plugin to add
	 */
	public async addPlugin(plugin: Plugin) {
		if (plugin == null || typeof plugin !== 'object') throw new IllegalArgumentError('Plugin must be a object');
		if (typeof plugin.name !== 'string') throw new IllegalArgumentError('Plugin name must be a string');
		if (!plugin.name) throw new PluginRegistrationError(plugin, 'Plugin must specify a name');
		if (this.plugins.has(plugin.name)) throw new PluginRegistrationError(plugin, 'Plugin names must be unique');

		await this.registerPlugin(plugin);

		return plugin.name;
	}

	/**
	 * Remove a Plugin from Bento
	 * @param name - name of plugin to remove
	 */
	public async removePlugin(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Plugin name must be a string');
		if (!name) throw new IllegalArgumentError('Plugin name must not be empty');

		const plugin = this.plugins.get(name);
		if (!plugin) throw new Error(`Plugin "${name}" is not currently attached`);

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
	 * @param plugins - array of plugins
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
	}

	public resolveComponentName(component: PrimaryComponent | string) {
		let name = null;
		if (typeof component === 'string') name = component;
		else {
			// check if we have the constructor
			if (this.primaryConstructors.has(component)) name = this.primaryConstructors.get(component);

			// check if .name exists on the object
			else if (Object.prototype.hasOwnProperty.call(component, 'name')) name = component.name;
		}

		if (name == null) throw new Error('Could not determine component name');

		// verfiy the name resolved actually exists
		// if (!this.primary.has(name)) throw new Error('Resolved name does not have a corresponding component');

		return name;
	}

	/**
	 * Add a Primary Component to Bento
	 * @param component - Primary Component
	 */
	public async addPrimaryComponent(component: PrimaryComponent): Promise<string> {
		if (component == null || typeof component !== 'object') throw new IllegalArgumentError('Component must be a object');
		if (typeof component.name !== 'string') throw new IllegalArgumentError('Component name must be a string');
		if (!component.name) throw new ComponentRegistrationError(component, 'Primary components must specify a name');
		if (this.primary.has(component.name)) throw new ComponentRegistrationError(component, `Component name "${component.name}" must be unique`);

		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, `"${component.name}" Component dependencies is not an array`);
		}

		// determine dependencies
		const missing = this.getMissingDependencies(component);
		if (missing.length === 0) {
			// All dependencies are already loaded
			const success = await this.registerComponent(ComponentType.Primary, component);

			// if any pending components attempt to handle them now
			if (success && this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// not able to load this component yet :c
			this.pending.set(component.name, component);
		}

		return component.name;
	}

	/**
	 * Remove a Primary Component from Bento
	 * @param name - Name of primary component
	 */
	public async removePrimaryComponent(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!name) throw new IllegalArgumentError('Name must not be empty');

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

		// remove primaryConstructor
		if (component.constructor && this.primaryConstructors.has(component.constructor)) {
			this.primaryConstructors.delete(component.constructor);
		}
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

				const name = await this.registerComponent(ComponentType.Primary, component);
				if (name) loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}

	/**
	 * Add a Secondary Component to Bento
	 * @param component - Secondary Component
	 */
	public async addSecondaryComponent(component: SecondaryComponent) {
		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, 'Component dependencies is not an array');
		}

		// TODO Add check if pending components are still there
		// TODO Also add explicit depends to secondary components and check them
		const name = await this.registerComponent(ComponentType.Secondary, component);

		return name;
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

	private async registerComponent(type: ComponentType, component: PrimaryComponent | SecondaryComponent) {
		let name = null;
		if (type === ComponentType.Primary) name = component.name;
		else name = this.createID();

		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: name,
		});

		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies || [],
		});

		// Define property to know it's a primary or secondary component
		Object.defineProperty(component, Symbols.primary, {
			configurable: false,
			writable: false,
			enumerable: true,
			value: type === ComponentType.Primary,
		});

		// Create components' api
		const api = new ComponentAPI(this, component);

		// Define api
		Object.defineProperty(component, 'api', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: api,
		});

		// PRIMARY ONLY
		// if component has constructor lets track it
		if (type === ComponentType.Primary && component.constructor) {
			this.primaryConstructors.set(component.constructor, name);
		}

		// PRIMARY ONLY
		// Create primary component event helper if it doesn't already exist
		if (type === ComponentType.Primary && !this.events.has(name)) {
			const events = new ComponentEvents(name);
			this.events.set(name, events);
		}

		this.handleDecorators(component);

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				throw new ComponentRegistrationError(component, `Primary component "${component.name}" failed loading`).setCause(e);
			}
		}

		if (type === ComponentType.Primary) this.primary.set(name, component);
		else this.secondary.set(name, component);

		return name;
	}

	private handleDecorators(component: PrimaryComponent | SecondaryComponent) {
		// Subscribe to all the events from the decorator subscriptions
		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				component.api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}

		// Add property descriptors for all the decorated variables
		const variables: DecoratorVariable[] = (component.constructor as any)[Symbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				component.api.defineVariable(variable.definition);
			}
		}
	}
}
