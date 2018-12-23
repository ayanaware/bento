'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';
import { PluginRegistrationError } from '../errors';
import { Plugin } from '../interfaces';

import { ReferenceManager } from './ReferenceManager';

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
	 */
	public resolveName(reference: Plugin | string | any) {
		return this.references.resolveName(reference);
	}

	public getPlugin(reference: Plugin | string | any) {
		const name = this.resolveName(reference);
		if (!this.plugins.has(name)) return null;

		return this.plugins.get(name);
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

		// call onLoad
		if (plugin.onLoad) {
			await plugin.onLoad(this.bento);
		}

		this.plugins.set(plugin.name, plugin);
	}
}