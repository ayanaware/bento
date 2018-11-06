'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';

export interface ConfigItemValue {
	env?: string;
	file?: string;
	url?: string;
	[key: string]: any;
}

export interface ConfigItemValidator {
	name: string;
	arg?: any;
}

export interface ConfigItem {
	type: string;
	name: string;
	value: string | ConfigItemValue;
	default?: any;
	required?: boolean;
	validator?: string | ConfigItemValidator;
}

export interface ConfigLoaderOptions {
	definitions?: ConfigItem[],
	file?: string;
	url?: string;
};

export class ConfigLoader {
	protected bento: Bento;

	public name: string;

	private definitions: Map<string, ConfigItem>;
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
		// TODO: move the below ifs to a new function "loadDefinitions"
		
		// add definitions from file
		if (this.opts.file) {
			// TODO: add definitions from a file on local system
		}

		// add definitions from url
		if (this.opts.url) {
			// TODO: add definitions from a url
		}

		// add definitions from code
		if (typeof this.opts.definitions !== null && Array.isArray(this.opts.definitions)) {
			for (const definition of this.opts.definitions) {
				await this.addDefinition(definition);
			}
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

	public async addDefinition(item: ConfigItem) {
		if (!item.type) throw new Error('ConfigItem must define a type');
		if (!item.name) throw new Error('ConfigItem must define a name');
		if (typeof item.value == null) throw new Error('ConfigItem must define a value');

		if (['string', 'number', 'boolean'].indexOf(item.type) == -1)
			throw new IllegalArgumentError('Invalid type specified')
		
		this.definitions.set(item.name, item);
	}

	public async removeDefinition(name: string) {
		if (!this.definitions.has(name)) throw new Error('Definition not currently loaded');
		this.definitions.delete(name);
	}

	private async processDefinitions() {
		for (const [name, definition] of this.definitions.entries()) {
			const value = await this.processValue(definition);
			this.bento.setConfig(name, value);
		}
	}

	/**
	 * Parses a ConfigItem and attempts to load value it defines
	 * @param item - The ConfigItem to process
	 */
	private async processValue(item: ConfigItem): Promise<any> {
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
		if (!value && item.required) throw new Error('ConfigItem required and unable to find a suitible value');

		// TODO: use item.type to convert types

		// Run validator
		if (item.validator) {
			if (typeof item.validator === 'object'){
				const validator = this.validators.get(item.validator.name);
				if (!validator) throw new Error('Validator does not exist!');

				const result = validator(value, item.validator.arg);
				if (!result) throw new Error('Value failed to pass validator');
			} else if (typeof item.validator === 'string') {
				const validator = this.validators.get(item.validator);
				if (!validator) throw new Error('Validator does not exist!');
			} else {
				// PANIC!
			}
		}

		return value;
	}
}
