'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../../Bento';
import { Component } from '../../components';
import { PluginError, PluginRegistrationError } from '../../errors';
import { PluginReference } from '../../references';
import { ReferenceManager } from '../../references/internal';
import { Plugin } from '../interfaces';
import { PluginAPI } from '../PluginAPI';

export enum PluginHook {
	onPreComponentLoad = 'onPreComponentLoad',
	onPreComponentUnload = 'onPreComponentUnload',
	onPostComponentLoad = 'onPostComponentLoad',
	onPostComponentUnload = 'onPostComponentUnload',
}

export class PluginManager {
	private readonly bento: Bento;

	private readonly references: ReferenceManager<Plugin> = new ReferenceManager();
	private readonly plugins: Map<string, Plugin> = new Map();

	public constructor(bento: Bento) {
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
	public resolveName(reference: PluginReference) {
		return this.references.resolveName(reference);
	}

	/**
	 * Check if a given plugin exists
	 *
	 * @param reference Plugin instance, name or reference
	 *
	 * @returns boolean
	 */
	public hasPlugin(reference: PluginReference) {
		const name = this.resolveName(reference);

		return this.plugins.has(name);
	}

	/**
	 * Get plugin instance
	 * @param reference Plugin name or reference
	 *
	 * @returns Plugin instance
	 */
	public getPlugin<T extends Plugin>(reference: PluginReference): T {
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
	public async addPlugins(plugins: Array<Plugin>) {
		if (!Array.isArray(plugins)) throw new IllegalArgumentError('addPlugins only accepts an array.');

		const results = [];
		for (const plugin of plugins) {
			const name = await this.addPlugin(plugin);
			results.push(name);
		}

		return results;
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

		// create and inject plugin api
		const api = new PluginAPI(this.bento, plugin);
		Object.defineProperty(plugin, 'api', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: api,
		});

		// plugin must be defined before calling onload.
		// this is because plugins can add components and other objects
		// that will then need the plugin itself to continue loading
		this.plugins.set(plugin.name, plugin);

		// call onLoad
		if (plugin.onLoad) {
			try {
				await plugin.onLoad(plugin.api);
			} catch (e) {
				this.plugins.delete(plugin.name);
				throw e;
			}
		}
	}

	/**
	 * FOR INTERNAL PACKAGE USE ONLY
	 *
	 * Calls a given hook for all plugins
	 * This is an internal function to be used by bento managers.
	 * @param hookName Hook name
	 * @param component Component
	 *
	 * @package
	 * @see {@link docs/internal-functions}
	 */
	private async __handlePluginHook(hookName: PluginHook | string, component: Component) {
		for (const plugin of this.plugins.values()) {
			if (!(plugin as Plugin & { [key: string]: any })[hookName]) continue;

			try {
				await (plugin as Plugin & { [key: string]: any })[hookName](component);
			} catch (e) {
				throw new PluginError(`Plugin "${plugin.name}" ${hookName} hook threw an error`).setCause(e);
			}
		}
	}
}
