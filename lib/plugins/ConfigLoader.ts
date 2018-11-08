'use strict';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';

export interface ConfigDefinitionValue {
	env?: string;
	file?: string;
	url?: string;
	[key: string]: any;
}

export interface ConfigDefinitionValidator {
	name: string;
	arg?: any;
}

export interface ConfigDefinition {
	type: string;
	name: string;
	value: string | ConfigDefinitionValue;
	default?: any;
	required?: boolean;
	validator?: string | ConfigDefinitionValidator;
}

export enum ConfigDefinitionListType {
	INLINE = 0,
	FILE = 1,
	URL = 2,
}

export interface ConfigLoaderOptions {
	definitions?: ConfigDefinition[];
	file?: string;
	url?: string;
}

export class ConfigLoader {
	public bento: Bento;

	public name: string;

	private definitions: Map<string, ConfigDefinition>;
	private validators: Map<string, (value: any, arg: any) => boolean>;

	private opts: ConfigLoaderOptions;

	public constructor(opts: ConfigLoaderOptions) {
		this.name = 'ConfigLoader';

		this.definitions = new Map();
		this.validators = new Map();

		this.opts = Object.assign({}, {
			config: null,
			file: null,
		}, opts);

		// define basic validators
		this.addValidator('lt', (value, arg) => {
			if (value < arg) return true;
			return false;
		});

		this.addValidator('gt', (value, arg) => {
			if (value > arg) return true;
			return false;
		});
	}

	public async onLoad() {
		// add definitions from file
		if (this.opts.file) {
			// TODO: add definitions from a file on local system
			// await this.
		}

		// add definitions from url
		if (this.opts.url) {
			// TODO: add definitions from a url
		}

		// add definitions from code
		if (typeof this.opts.definitions !== null && Array.isArray(this.opts.definitions)) {
			await this.loadDefinitionList(ConfigDefinitionListType.INLINE, this.opts.definitions);
		}

		// process definitions and load values into bento instnace
		return this.processDefinitions();
	}

	public async onUnload() {
		console.log('bye bye!');
	}

	public async addValidator(name: string, validator: (value: any, arg: any) => boolean) {
		if (this.validators.has(name)) throw new Error('Validator already exists');
		this.validators.set(name, validator);
	}

	public async removeValidator(name: string) {
		if (!this.validators.has(name)) throw new Error('Validator not currently loaded');
		this.validators.delete(name);
	}

	public async addDefinition(item: ConfigDefinition) {
		if (!item.type) throw new Error('DefinitionItem must define a type');
		if (!item.name) throw new Error('DefinitionItem must define a name');
		if (typeof item.value == null) throw new Error('DefinitionItem must define a value');

		if (['string', 'number', 'boolean'].indexOf(item.type) === -1) {
			throw new IllegalArgumentError('Invalid type specified');
		}

		this.definitions.set(item.name, item);
	}

	public async removeDefinition(name: string) {
		if (!this.definitions.has(name)) throw new Error('Definition not currently loaded');
		this.definitions.delete(name);
	}

	public async loadDefinitionList(type: ConfigDefinitionListType, arg: string | ConfigDefinition[]) {
		switch (type) {
			case ConfigDefinitionListType.INLINE: {
				if (!Array.isArray(arg)) throw new Error('Expected array of DefinitionItems');

				// load the definitions
				for (const definition of arg) await this.addDefinition(definition);

				break;
			}

			case ConfigDefinitionListType.FILE: {
				// TODO: check if file exists, read file, parse file, add definitions

				break;
			}

			case ConfigDefinitionListType.URL: {
				// TODO: hit url, verify 200, parse body, add definitions

				break;
			}

			default: {
				throw new IllegalArgumentError(`Invalid ConfigDefinitionListType "${type}"`);
			}
		}
	}

	private async processDefinitions() {
		for (const [name, definition] of this.definitions.entries()) {
			const value = await this.processValue(definition);
			this.bento.setConfig(name, value);
		}
	}

	/**
	 * Parses a DefinitionItem and attempts to load value it defines
	 * @param item - The DefinitionItem to process
	 */
	private async processValue(item: ConfigDefinition): Promise<any> {
		let value = null;
		if (typeof item.value === 'object') {
			// check for invalid usage of file & url
			if (item.value.file && item.value.url) throw new Error('You can not define both a file and a url');

			if (item.value.file) {
				// TODO: attempt to load value from file
			} else if (item.value.url) {
				// TODO: fetch value from url
			}

			// env overrides
			if (item.value.env) {
				value = process.env[item.value.env];
			}
		} else value = item.value;

		// if null and have default set now
		if (!value && item.default) value = item.default;

		// if required and still null fail now
		if (!value && item.required) throw new Error('DefinitionItem required and unable to find a suitible value');

		// TODO: use item.type to convert types

		// Run validator
		if (item.validator) {
			const name = typeof item.validator === 'object' ? item.validator.name : item.validator;
			const validator = this.validators.get(name);
			if (!validator) throw new Error('Validator does not exist!');

			const result = validator(value, typeof item.validator === 'object' ? item.validator.arg : null);
		}

		return value;
	}
}
