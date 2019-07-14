
import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { VariableSource, VariableSourceType } from '../../../interfaces';
import { PluginAPI } from '../../PluginAPI';

export interface ConfigLoaderDefinition {
	name: string;
	env?: string;
	value?: any;
}

export class ConfigLoader {
	public api: PluginAPI;
	public name: string = 'ConfigLoader';

	private readonly definitions: Map<string, ConfigLoaderDefinition> = new Map();

	public async onLoad() {
		return this.reloadValues();
	}

	public async onUnload() {
		// Do something, eventually, maybe?
	}

	/**
	 * Add a new definition
	 * @param definition - definition object
	 * @param reload - auto reload config values into betno?
	 *
	 * @returns Definition name
	 */
	public async addDefinition(definition: ConfigLoaderDefinition, reload: boolean = true) {
		if (definition == null || typeof definition !== 'object') throw new IllegalArgumentError('Definition must be a object');
		if (typeof definition.name !== 'string') throw new IllegalArgumentError('Definition name must be a string');
		if (!definition.name) throw new IllegalArgumentError('Definition must specify a name');

		if (definition.value === undefined && definition.env === undefined) {
			throw new IllegalArgumentError('Definition must specify at least one of the following: value, env');
		}

		this.definitions.set(definition.name, definition);

		if (reload) await this.reloadValues();

		return definition.name;
	}

	/**
	 * Remove a previously added definition
	 * @param name - definition name
	 */
	public async removeDefinition(name: string) {
		if (typeof name !== 'string') throw new IllegalArgumentError('Name must be a string');
		if (!name) throw new IllegalArgumentError('Name must not be empty');

		if (!this.definitions.has(name)) throw new IllegalStateError(`Definition "${name}" is not currently loaded`);

		this.definitions.delete(name);
	}

	/**
	 * Add multiple definitions at once
	 * @param definitions - array of definitions
	 */
	public async addDefinitions(definitions: Array<ConfigLoaderDefinition>) {
		if (!Array.isArray(definitions)) throw new IllegalArgumentError('Definitions must be an array');

		for (const definition of definitions) await this.addDefinition(definition, false);

		// manually call reload after done adding
		await this.reloadValues();
	}

	public async reloadValues() {
		if (this.api == null) return;

		for (const definition of this.definitions.values()) {
			const value = await this.getValue(definition);

			// define source
			const source: VariableSource = { type: VariableSourceType.INLINE };
			if (definition.env != null) {
				source.type = VariableSourceType.ENV;
				source.source = definition.env;
			}

			this.api.getBento().variables.setVariable(definition.name, value, source);
		}
	}

	private async getValue(definition: ConfigLoaderDefinition) {
		if (definition == null || typeof definition !== 'object') throw new IllegalArgumentError('Definition must be a object');

		// tslint:disable-next-line:no-unnecessary-initializer
		let value = undefined;

		// inline value defined
		if (definition.value !== undefined) value = definition.value;

		// env variable name defined
		if (definition.env !== undefined) {
			// verify that item actually exists in env
			if (Object.keys(process.env).indexOf(definition.env) > -1) value = process.env[definition.env];
		}

		return value;
	}
}
