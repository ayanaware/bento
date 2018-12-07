'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';
import { Plugin } from '../interfaces';

import { PluginRegistrationError } from '../errors';

export class PluginManager {
	private bento: Bento;

	private plugins: Map<string, Plugin> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	// public getPlugin(reference: Plugin | string) {

	// }

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
			value: this.bento,
		});

		// call onLoad
		if (plugin.onLoad) {
			await plugin.onLoad();
		}

		this.plugins.set(plugin.name, plugin);
	}
}
