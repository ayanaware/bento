'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { ConfigDefinition, ConfigDefinitionType } from '../interfaces';

export interface ConfigValueSource {
	env?: string;
	file?: string;
	value?: any;
}

export class ConfigBuilder {
	private definitions: Map<string, ConfigDefinition> = new Map();

	public add(type: ConfigDefinitionType, name: string, values: ConfigValueSource) {
		if (Object.values(ConfigDefinitionType).indexOf(type) === -1) throw new IllegalArgumentError(`Unknown type "${type}"`);
		if (typeof name !== 'string' || name == null) throw new IllegalArgumentError(`Name must be a string`);

		const hasOne = ['env', 'file', 'value'].reduce((a, item) => {
			if (Object.prototype.hasOwnProperty.call(values, item)) a.push(item);
			return a;
		}, []).length >= 1;

		if (!hasOne) throw new IllegalArgumentError('ConfigValueSource must define at least one source. env, file, or value');

		const definition: ConfigDefinition = Object.assign({}, { type, name }, values);
		this.definitions.set(name, definition);
	}

	public delete(name: string) {
		if (typeof name !== 'string' || name == null) throw new IllegalArgumentError(`Name must be a string`);
		if (!this.definitions.has(name)) throw new IllegalStateError(`ConfigDefition "${name}" does not exist`);

		this.definitions.delete(name);
	}

	public build(): ConfigDefinition[] {
		return Array.from(this.definitions.values()).reduce((a, definition) => {
			a.push(definition);
			return a;
		}, []);
	}
}
