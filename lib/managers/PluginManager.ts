'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';
import { PluginRegistrationError } from '../errors';
import { Component, Plugin } from '../interfaces';

import { ReferenceManager } from './ReferenceManager';
import { PluginError } from '../errors/PluginError';

export class PluginManager {
	private readonly bento: Bento;

	private readonly references: ReferenceManager<Plugin> = new ReferenceManager();

	private readonly plugins: Map<string, Plugin> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	/**
	 * Delegate for the resolveName function
	 *
	 * @param reference Plugin instance, name or reference
	 *
	 * @see ReferenceManager#resolveName
	 * @returns resolved component name
	 */
	public resolveName(reference: Plugin | string | any) {
		return this.references.resolveName(reference);
	}

	/**
	 * Get plugin instance
	 * @param reference - Plugin name or reference
	 *
	 * @returns Plugin instance
	 */
	public getPlugin<T extends Plugin>(reference: Plugin | string | any): T {
		const name = this.resolveName(reference);
		if (!this.plugins.has(name)) return null;

		return this.plugins.get(name) as T;
	}

	/**
	 * Get instances of all currently loaded plugins
	 *
	 * @returns Array of component instances
	 */
	public getPlugins() {
		return Array.from(this.plugins.values());
	}

	/**
	 * Add a Plugin to Bento
	 * @param plugin Plugin instance
	 *
	 * @returns Plugin name
	 */
	public async addPlugin(plugin: Plugin) {
		if (plugin == null || typeof plugin !== 'object') throw new IllegalArgumentError('Plugin must be a object');
		if (typeof plugin.name !== 'string') throw new IllegalArgumentError('Plugin name must be a string');
		if (!plugin.name) throw new PluginRegistrationError(plugin, 'Plugin must specify a name');
		if (this.plugins.has(plugin.name)) throw new PluginRegistrationError(plugin, 'Plugin names must be unique');

		await this.loadPlugin(plugin);

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

		this.references.removeReference(plugin);
	}

	/**
	 * Adds plugins to Bento in order of array
	 * @param plugins - array of plugins
	 *
	 * @returns Array of loaded plugin names
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

	/**
	 * Notifies all plugins that a new component has been loaded into bento.
	 * This is an internal function to be used by bento managers.
	 * @param component - The loaded component
	 */
	public async handleComponentLoad(component: Component) {
		for (const plugin of this.plugins.values()) {
			if (!plugin.onComponentLoad) continue;

			try {
				await plugin.onComponentLoad(component);
			} catch (e) {
				throw new PluginError(`Plugin "${plugin.name}" onComponentLoad hook threw an error`).setCause(e);
			}
		}
	}

	/**
	 * Notifies all plugins that a component was unloaded from bento.
	 * This is an internal function to be used by bento managers.
	 * @param component - The unloaded component
	 */
	public async handleComponentUnload(component: Component) {
		for (const plugin of this.plugins.values()) {
			if (!plugin.onComponentUnload) continue;

			try {
				await plugin.onComponentUnload(component);
			} catch (e) {
				throw new PluginError(`Plugin "${plugin.name}" onComponentUnload hook threw an error`).setCause(e);
			}
		}
	}

	private async loadPlugin(plugin: Plugin) {
		Object.defineProperty(plugin, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: plugin.name,
		});

		// track any constructors
		this.references.addReference(plugin);

		// Define bento instance
		Object.defineProperty(plugin, 'bento', {
			configurable: false,
			writable: false,
			enumerable: true,
			value: this.bento,
		});

		// plugin must be defined before calling onload.
		// this is because plugins can add components and other objects
		// that will then need the plugin itself to continue loading
		this.plugins.set(plugin.name, plugin);

		// call onLoad
		if (plugin.onLoad) {
			try {
				await plugin.onLoad(this.bento);
			} catch (e) {
				this.plugins.delete(plugin.name);
				throw e;
			}
		}
	}
}
