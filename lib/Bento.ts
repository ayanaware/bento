'use strict';

import * as crypto from 'crypto';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { Symbols } from './constants/internal';
import { ComponentRegistrationError, PluginRegistrationError, ValidatorRegistrationError } from './errors';
import { ComponentAPI } from './helpers/ComponentAPI';
import { ComponentEvents } from './helpers/ComponentEvents';
import { Component, Plugin } from './interfaces';
import { DecoratorSubscription, DecoratorVariable } from './interfaces/internal';

export interface BentoOptions {}

export interface SetProperties {
	[key: string]: any;
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
	 * Currently loaded components
	 */
	public readonly components: Map<string, Component> = new Map();
	private readonly componentConstructors: Map<any, string> = new Map();

	/**
	 * Components currently pending to be loaded
	 */
	private readonly pending: Map<string, Component> = new Map();

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
		if (value === undefined) return;

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
	 * Fully removes all traces of a variable from bento
	 * @param name - name of variable
	 */
	public deleteVariable(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Variable name must be a string');
		if (this.variables.has(name)) this.variables.delete(name);
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

	public resolveComponentName(component: Component | string) {
		let name = null;
		if (typeof component === 'string') name = component;
		else if (component != null) {
			// check if we have the constructor
			if (this.componentConstructors.has(component)) name = this.componentConstructors.get(component);

			// check if .name exists on the object
			else if (Object.prototype.hasOwnProperty.call(component, 'name')) name = component.name;
		}

		if (name == null) throw new Error('Could not determine component name');
		return name;
	}

	/**
	 * Enforces Bento API and prepares component to be loaded
	 * @param component - Component to be prepared
	 */
	private prepareComponent(component: Component) {
		// take control and redefine component name
		Object.defineProperty(component, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.name,
		});

		// if component has constructor lets track it
		if (component.constructor) {
			this.componentConstructors.set(component.constructor, component.name);
		}

		// Create component events if it does not already exist
		if (!this.events.has(component.name)) {
			const events = new ComponentEvents(component.name);
			this.events.set(component.name, events);
		}

		// run dependencies through the resolver
		component.dependencies = this.resolveDependencies(component.dependencies || []);
		Object.defineProperty(component, 'dependencies', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: component.dependencies,
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

		// Add property descriptors for all the decorated variables
		const variables: DecoratorVariable[] = (component.constructor as any)[Symbols.variables];
		if (Array.isArray(variables)) {
			for (const variable of variables) {
				component.api.injectVariable(Object.assign({}, variable.definition, { property: variable.propertyKey }));
			}
		}
	}

	/**
	 * Add a Component to Bento
	 * @param component - Component
	 */
	public async addComponent(component: Component): Promise<string> {
		if (component == null || typeof component !== 'object') throw new IllegalArgumentError('Component must be a object');
		if (typeof component.name !== 'string') throw new IllegalArgumentError('Component name must be a string');
		if (!component.name) throw new ComponentRegistrationError(component, 'Components must specify a name');
		if (this.components.has(component.name)) throw new ComponentRegistrationError(component, `Component name "${component.name}" must be unique`);

		// Check dependencies
		if (component.dependencies != null && !Array.isArray(component.dependencies)) {
			throw new ComponentRegistrationError(component, `"${component.name}" Component dependencies is not an array`);
		} else if (component.dependencies == null) component.dependencies = [];

		// prepare component
		this.prepareComponent(component);

		// determine dependencies
		const missing = this.getMissingDependencies(component.dependencies);
		if (missing.length === 0) {
			// All dependencies are already loaded, go ahead and load the component
			await this.loadComponent(component);

			// loaded successfuly, if any pending components, attempt to handle them now
			if (this.pending.size > 0) await this.handlePendingComponents();
		} else {
			// not able to load this component yet :c
			this.pending.set(component.name, component);
		}

		return component.name;
	}

	/**
	 * Remove a Component from Bento
	 * @param name - Name of component
	 */
	public async removeComponent(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!name) throw new IllegalArgumentError('Name must not be empty');

		const component = this.components.get(name);
		if (!component) throw new Error(`Component '${name}' is not currently loaded.`);

		// TODO: check if required, required components can't be unloaded

		// call unMount
		if (component.onUnload) {
			try {
				await component.onUnload();
			} catch (e) {
				// force unload
			}
		}

		// remove componentConstructor
		if (component.constructor && this.componentConstructors.has(component.constructor)) {
			this.componentConstructors.delete(component.constructor);
		}
	}

	public resolveDependencies(dependencies: Component[] | string[]) {
		if (!Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);

		const resolved = [];
		for (const dependency of dependencies) {
			try {
				const name = this.resolveComponentName(dependency);
				resolved.push(name);
			} catch (e) {
				throw new IllegalStateError('Unable to resolve dependency').setCause(e);
			}
		}

		return resolved;
	}

	private getMissingDependencies(dependencies: Component[] | string[]) {
		if (!Array.isArray(dependencies)) throw new IllegalArgumentError(`Dependencies is not an array`);

		// run dependencies through the resolver
		dependencies = this.resolveDependencies(dependencies);

		return (dependencies as string[]).reduce((a, dependency) => {
			if (!this.components.has(dependency)) a.push(dependency);

			return a;
		}, []);
	}

	private async handlePendingComponents(): Promise<void> {
		let loaded = 0;

		for (const component of this.pending.values()) {
			const missing = await this.getMissingDependencies(component.dependencies);
			if (missing.length === 0) {
				this.pending.delete(component.name);

				await this.loadComponent(component);
				loaded++;
			}
		}

		if (loaded > 0) await this.handlePendingComponents();
	}

	private async loadComponent(component: Component) {
		// Subscribe to all the events from the decorator subscriptions
		const subscriptions: DecoratorSubscription[] = (component.constructor as any)[Symbols.subscriptions];
		if (Array.isArray(subscriptions)) {
			for (const subscription of subscriptions) {
				component.api.subscribe(subscription.type, subscription.namespace, subscription.name, subscription.handler, component);
			}
		}

		// Call onLoad if present
		if (component.onLoad) {
			try {
				await component.onLoad();
			} catch (e) {
				throw new ComponentRegistrationError(component, `Component "${component.name}" failed loading`).setCause(e);
			}
		}

		this.components.set(component.name, component);
	}
}
