
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { ProcessingError } from '@ayanaware/errors';

import { Bento } from '../../../Bento';

import { ConfigLoader } from './ConfigLoader';

import { Logger } from '@ayanaware/logger-api';
const log = Logger.get();

/**
 * @ignore
 */
const access = util.promisify(fs.access);

/**
 * @ignore
 */
const readFile = util.promisify(fs.readFile);

/**
 * @deprecated Please use VariableFileLoader instead
 */
export class ConfigFileLoader extends ConfigLoader {
	public bento: Bento;
	public name: string = 'ConfigFileLoader';

	private readonly files: Set<string> = new Set();

	public async onLoad() {
		log.warn('ConfigFileLoader has been deprecated in favor of VariableFileLoader');
		return this.reloadFiles();
	}

	/**
	 * Add file and
	 * @param file - Path to file
	 */
	public addFile(...file: Array<string>) {
		const absolute = path.resolve(...file);
		this.files.add(absolute);
	}

	public removeFile(...file: Array<string>) {
		const absolute = path.resolve(...file);
		this.files.add(absolute);

		if (this.files.has(absolute)) this.files.delete(absolute);
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
