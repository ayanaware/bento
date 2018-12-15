'use strict';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { ConfigDefinition, ConfigDefinitionType, VariableSource, VariableSourceType } from '../interfaces';

export interface ConfigBuilderDefinition {
	type: ConfigDefinitionType;
	env?: string;
	file?: string;
	value?: any;
}

export class ConfigBuilder {
	private definitions: Map<string, ConfigDefinition> = new Map();

	public add(name: string, item: ConfigBuilderDefinition) {
		if (typeof name !== 'string' || name === '') throw new IllegalArgumentError(`Name must be a string`);

		if (item == null || typeof item !== 'object') throw new IllegalArgumentError(`Item must be a object`);
		if (item.type == null && Object.values(ConfigDefinitionType).indexOf(item.type) === -1) throw new IllegalArgumentError(`Invalid type "${item.type}"`);

		const hasOne = ['env', 'file', 'value'].reduce((a, i) => {
			if (Object.prototype.hasOwnProperty.call(item, i)) a.push(item);
			return a;
		}, []).length >= 1;
		if (!hasOne) throw new IllegalArgumentError('Definition must specify one or more sources: env, file, or value');

		const definition: ConfigDefinition = Object.assign({}, { name }, item);
		this.definitions.set(name, definition);

		return this;
	}

	public delete(name: string) {
		if (typeof name !== 'string' || name === '') throw new IllegalArgumentError(`Name must be a string`);
		if (!this.definitions.has(name)) throw new IllegalStateError(`Definition "${name}" does not exist`);

		this.definitions.delete(name);
		return this;
	}

	public build(): ConfigDefinition[] {
		return Array.from(this.definitions.values()).reduce((a, definition) => {
			a.push(definition);
			return a;
		}, []);
	}
}
