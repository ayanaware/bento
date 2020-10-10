import { ProcessingError } from '@ayanaware/errors';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import { PluginAPI } from '../../entities';
import { VariableLoader } from './VariableLoader';

import { Logger } from '@ayanaware/logger-api';
const log = Logger.get();

const accessAsync = promisify(fs.access);
const readFileAsync = promisify(fs.readFile);

/**
 * Allows you to load Bento Variables and set their defaults from files
 * If you have a custom file format or prefer to use something other than JSON
 * You can provide a custom `parseFileContents` function. Just return Key/Value pairs
 * derived from the file Buffer.
 * 
 * Keep in mind that if you have key `HELLO_WORLD` in a file or defaults file and `HELLO_WORLD` in the enviorment
 * the value from the enviorment will take priority
 */
export class VariableFileLoader extends VariableLoader {
	public name = 'VariableFileLoader';
	public api!: PluginAPI;

	private watching: boolean;

	/**
	 * @param watching Enable file watching? (Automatic hot-loading of variables in files)
	 */
	public constructor(watching: boolean) {
		super();

		this.watching = watching;
	}

	/**
	 * Registered files and Variables they loaded
	 */
	private readonly files: Map<string, Set<string>> = new Map();

	/**
	 * Registered fs Watchers
	 */
	private readonly watchers: Map<string, fs.FSWatcher> = new Map();


	/**
	 * Add Variables File
	 * @param location File Location
	 */
	public async addFile(...location: Array<string>) {
		const abs = path.resolve(...location);
		await this.processFile(abs);

		// start watcher
		if (this.watching) this.addWatcher(abs);
	}

	/**
	 * Remove Variables file
	 * @param purge Purge Variables that this file Added
	 * @param location File Location
	 */
	public async removeFile(purge: boolean, ...location: Array<string>) {
		const abs = path.resolve(...location);
		if (!this.files.has(abs)) return;

		// purge requested, unload all variables we contributed
		if (purge) {
			const variables = this.files.get(abs);
			for (const variable of variables) this.unloadVariable(variable);
		}

		// close watcher if exist
		const watcher = this.watchers.get(abs)
		if (watcher) {
			watcher.close();
			this.watchers.delete(abs);
		}

		this.files.delete(abs);
	}

	/**
	 * Add Default Variables File
	 * If no value is found for a key the value from this file will be used
	 * @param location 
	 */
	public async addDefaultsFile(...location: Array<string>) {
		const abs = path.resolve(...location);
		await this.processFile(abs, true);

		// start watcher
		if (this.watching) this.addWatcher(abs, true);
	}

	public async removeDefaultsFile(purge: boolean, ...location: Array<string>) {
		const abs = path.resolve(...location);

		// purge requested, unload all variables we contributed
		if (purge) {
			const variables = this.files.get(abs);
			for (const variable of variables) this.unloadVariable(variable);
		}

		// close watcher if exist
		const watcher = this.watchers.get(abs)
		if (watcher) {
			watcher.close();
			this.watchers.delete(abs);
		}

		this.files.delete(abs);
	}

	private addWatcher(location: string, defaults: boolean = false) {
		try {
			const watcher = fs.watch(location, (event, filename) => {
				if (event !== 'change') return;
				if (!filename) return;

				this.processFile(location, defaults).then(() => {
					log.info(`Watcher "${location}": Successfully reprocessed file`);
				}).catch(e => {
					log.error(`Watcher "${location}" Error: ${e}`);
				});
			})

			this.watchers.set(location, watcher);
		} catch (e) {
			throw new Error(`Watcher "${location}" Failed to register`);
		}
	}

	/**
	 * Read and return file contents
	 * @param location File Location
	 *
	 * @returns File Buffer
	 */
	private async getFileContents(location: string) {
		try {
			await accessAsync(location, fs.constants.F_OK);

			return readFileAsync(location);
		} catch(e) {
			throw new ProcessingError(`Failed to getFileContents of "${location}"`).setCause(e);
		}
	}

	/**
	 * Convert File Buffer into Key/Value pairings
	 * @param data File Buffer
	 *
	 * @returns Key/Value Pairings Object
	 */
	public async parseFileContents(data: Buffer): Promise<{[key: string]: any}> {
		return JSON.parse(data.toString());
	}

	protected async processFile(location: string, defaults: boolean = false) {
		const data = await this.getFileContents(location);
		const pairings = await this.parseFileContents(data);

		if (!this.files.has(location)) this.files.set(location, new Set());

		for (const [key, def] of Object.entries(pairings)) {
			// mark file as owning this variable
			this.files.get(location).add(key);

			if (defaults) this.addVariable(key, def);
			else this.processVariable(key, pairings);
		}
	}

	/**
	 * Process Variable Key including from Key/Value Pairings Object
	 * @param key Key
	 * @param pairings Key/Value Pairings Object
	 */
	protected processVariable(key: string, pairings?: {[key: string]: any}) {
		let value = this.findVariableValue(key, pairings);
		if (value == null) value = this.variables.get(key);

		return this.loadVariable(key, value);
	}

	/**
	 * Grab Key value from pairings object. Defer to super
	 * @param key Key
	 * @param pairings Key/Value Pairings Object
	 */
	protected findVariableValue(key: string, pairings?: {[key: string]: any}) {
		if (typeof pairings !== 'object') return super.findVariableValue(key);

		// fetch value from pairings
		let value = null;
		if (pairings[key]) value = pairings[key];

		// defer to super
		const overrideValue = super.findVariableValue(key);
		if (overrideValue) value = overrideValue;

		return value;
	}
}
