'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

export interface ConfigLoaderOptions {
	file?: string;
};

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

export class ConfigLoader {
	public constructor(private opts: ConfigLoaderOptions) {
		this.opts = Object.assign({}, {
			file: null,
		}, this.opts);
	}

	public async onLoad() {
		console.log('boo!');
	}

	public async onUnload() {
		console.log('bye bye!');
	}
}
