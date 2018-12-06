'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { ProcessingError } from '@ayana/errors';

import { ConfigLoader } from './ConfigLoader';

/**
 * @ignore
 */
const access = util.promisify(fs.access);

/**
 * @ignore
 */
const readFile = util.promisify(fs.readFile);

export class ConfigFileLoader extends ConfigLoader {
	private files: string[] = [];

	public async onLoad() {
		return this.reloadFiles();
	}

	public addFile(...file: string[]) {
		const absolute = path.resolve(...file);
		this.files.push(absolute);
	}

	public removeFile(...file: string[]) {
		const absolute = path.resolve(...file);
		this.files.push(absolute);

		const index = this.files.indexOf(absolute);
		if (index === -1) return;

		this.files.splice(index, 1);
	}

	public async getFileContents(file: string) {
		try {
			await access(file, fs.constants.F_OK);
			return await readFile(file);
		} catch (e) {
			throw new ProcessingError(`Failed to read file "${file}"`).setCause(e);
		}
	}

	public async parseFileDefinitions(data: Buffer): Promise<{[key: string]: any}> {
		return JSON.parse(data.toString());
	}

	public async reloadFiles() {
		for (const file of this.files) {
			const data = await this.getFileContents(file);

			try {
				const json = await this.parseFileDefinitions(data);

				// look for top level array or "variables" key with array
				if (Array.isArray(json)) {
					// top level array of definitions
					await this.addDefinitions(json);
				} else if (Object.prototype.hasOwnProperty.call(json, 'variables')) {
					// "variables" key exists
					if (Array.isArray(json.variables)) {
						await this.addDefinitions(json.variables);
					} else throw new ProcessingError(`Found non array "variables" key`);
				} else {
					throw new ProcessingError(`Unable to find any valid looking json`);
				}
			} catch (e) {
				throw new ProcessingError(`Failed to parse file "${file}"`).setCause(e);
			}
		}

		return this.reloadValues();
	}
}
