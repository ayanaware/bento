import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import { ProcessingError } from '@ayanaware/errors';
import { Logger } from '@ayanaware/logger-api';

import { PluginAPI } from '../../entities/api/PluginAPI';

import { VariableLoader } from './VariableLoader';

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

	/**
	 * Registered files and Variables they loaded
	 */
	public readonly files: Map<string, Set<string>> = new Map();

	private readonly watching: boolean;

	/**
	 * Registered fs Watchers
	 */
	private readonly watchers: Map<string, fs.FSWatcher> = new Map();

	/**
	 * @param watching Enable file watching? (Automatic hot-loading of variables in files)
	 */
	public constructor(watching: boolean = true) {
		super();

		this.watching = watching;
	}

	/**
	 * Add Multiple Variable Files
	 * @param files Array of File Locations
	 * @param defaults Defaults Mode
	 *
	 * @returns Array<Path>
	 */
	public async addFiles(files: Array<Array<string>>, defaults: boolean): Promise<Array<string>> {
		const results: Array<string> = [];
		for (const file of files) {
			const location = await this.addFile(file, defaults);
			results.push(location);
		}

		return results;
	}

	/**
	 * Add Variables File
	 * @param location File Location
	 * @param defaults Defaults Mode
	 *
	 * @throws ProcessingError If `fs.access` check fails and `defaults` is true
	 * @returns Path
	 */
	public async addFile(location: Array<string>, defaults: boolean = false): Promise<string> {
		const abs = path.resolve(...location);
		try {
			await accessAsync(abs, fs.constants.F_OK);
		} catch (e) {
			// defaults files are "required", so bubble error
			if (defaults) throw new ProcessingError(`addFile(): Defaults file "${abs}" access check failed`).setCause(e as Error);

			log.warn(`addFile(): Ignoring File "${abs}", access check failed`);

			return;
		}

		await this.processFile(abs, defaults);

		// start watcher
		if (this.watching) this.addWatcher(abs, defaults);

		return abs;
	}

	/**
	 * Remove Variables file
	 * @param location File Location
	 * @param purge Purge Variables that this file Added
	 */
	public removeFile(location: Array<string>, purge: boolean): void {
		const abs = path.resolve(...location);
		if (!this.files.has(abs)) return;

		// purge requested, unload all variables we contributed
		if (purge) {
			const variables = this.files.get(abs);
			for (const variable of variables) this.unloadVariable(variable);
		}

		// close watcher if exist
		const watcher = this.watchers.get(abs);
		if (watcher) {
			watcher.close();
			this.watchers.delete(abs);
		}

		this.files.delete(abs);
	}

	private addWatcher(location: string, defaults: boolean) {
		try {
			const watcher = fs.watch(location, (event, filename) => {
				if (event !== 'change') return;
				if (!filename) return;

				this.processFile(location, defaults).then(() => {
					log.info(`Watcher "${location}": Successfully reprocessed file`);
				}).catch(e => {
					log.error(`Watcher "${location}" Error: ${e}`);
				});
			});

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
		} catch (e) {
			throw new ProcessingError(`getFileContents(): Failed for "${location}"`).setCause(e as Error);
		}
	}

	/**
	 * Convert File Buffer into Key/Value pairings
	 * @param data File Buffer
	 *
	 * @returns Key/Value Pairings Object
	 */
	public parseFileContents(data: Buffer): { [key: string]: unknown } {
		try {
			return JSON.parse(data.toString()) as Record<string, unknown>;
		} catch (e) {
			throw new ProcessingError('Failed to parse JSON').setCause(e as Error);
		}
	}

	protected async processFile(location: string, defaults: boolean): Promise<void> {
		const data = await this.getFileContents(location);
		const pairings = this.parseFileContents(data);

		// file/variable ownership
		if (!this.files.has(location)) this.files.set(location, new Set());

		for (const [key, fileValue] of Object.entries(pairings)) {
			// register variable
			this.variables.add(key);
			this.files.get(location).add(key);

			// add default if eligable
			if (defaults && fileValue !== undefined) this.defaults.set(key, fileValue);

			// process value
			let value = fileValue;

			// env override & defaults
			const override = this.getVariableValue(key);
			if (override !== undefined) value = override;
			if (value === undefined && this.defaults.has(key)) value = this.defaults.get(key);

			this.loadVariable(key, value);
		}
	}
}
