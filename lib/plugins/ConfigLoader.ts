'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError } from '@ayana/errors';

import { Bento } from '../Bento';

export interface ConfigItemValue {
	env?: string;
	file?: string;
	[key: string]: any;
}

export interface ConfigItemValidator {
	name: string;
	value?: any;
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
	config?: ConfigItem[],
	file?: string;
};

export class ConfigLoader {
	protected bento: Bento;
	private opts: ConfigLoaderOptions;

	public constructor(opts: ConfigLoaderOptions) {
		this.opts = Object.assign({}, {
			config: null,
			file: null,
		}, opts);
	}

	public async onLoad() {
		if (this.opts.file) {
			// TODO do file loading stuff
		}

		if (typeof this.opts.config !== null && Array.isArray(this.opts.config)) {
			for (const cfg of this.opts.config) {
				const { key, value } = await this.processItem(cfg);
				this.bento.setConfig(key, value);
			}
		}
	}

	public async onUnload() {
		console.log('bye bye!');
	}

	private async processItem(item: ConfigItem): Promise<{ key: string, value: any }> {
		if (!item.type) throw new Error('ConfigItem must define a type');
		if (!item.name) throw new Error('ConfigItem must define a name');
		if (!item.value) throw new Error('ConfigItem must define a value');

		if (['string', 'number', 'boolean'].indexOf(item.type) == -1)
			throw new IllegalArgumentError('Invalid type specified')

		// determine value
		let value = null;
		if (typeof item.value === 'object') {
			if (item.value.file) {
				// TODO: attempt to load value from file
			}

			if (item.value.env) {
				value = process.env[item.value.env];
			}
		} else value = item.value;

		// if required and still null fail now
		if (!value && item.required) throw new Error('ConfigItem required and unable to find a suitible value');

		// TODO: use item.type to convert types

		// TODO: run validators

		return { key: item.name, value };
	}
}
