'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';
import { Plugin } from '../interfaces';

import { PluginRegistrationError } from '../errors';

export class PluginManager {
	private readonly bento: Bento;

	private readonly plugins: Map<string, Plugin> = new Map();
	private readonly constructors: Map<any, string> = new Map();

	constructor(bento: Bento) {
		this.bento = bento;
	}

	public getPlugin(reference: Plugin | string) {
		const name = this.resolveName(reference);
		if (!this.plugins.has(name)) return null;

		return this.plugins.get(name);
	}

	public resolveName(reference: Plugin | string) {
		let name = null;
		if (typeof reference === 'string') name = reference;
		else if (reference != null) {
			// check if we have the constructor
			if (this.constructors.has(reference)) name = this.constructors.get(reference);

			// check if .name exists on the object
			else if (Object.prototype.hasOwnProperty.call(reference, 'name')) name = reference.name;
		}

		if (name == null) throw new Error('Could not determine component name');
		return name;
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

		if (plugin.constructor && this.constructors.has(plugin.constructor)) {
			this.constructors.delete(plugin.constructor);
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

	private async loadPlugin(plugin: Plugin) {
		Object.defineProperty(plugin, 'name', {
			configurable: true,
			writable: false,
			enumerable: true,
			value: plugin.name,
		});

		// track any constructors
		if (plugin.constructor) {
			this.constructors.set(plugin.constructor, plugin.name);
		}

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
