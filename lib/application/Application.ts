import { constants as fsConstants, promises as fs } from 'fs';
import * as path from 'path';

import { IllegalStateError } from '@ayanaware/errors';

import { Bento } from '../Bento';
import { EntityType } from '../entities';
import { FSEntityLoader, VariableFileLoader } from '../plugins';

import { ApplicationConfig, ApplicationState } from './interfaces';

/** @ignore */
const CALLER_LINE_REGEX = /(?:at (?:.+?\()|at )(.+?):[0-9]+:[0-9]+/;

/**
 * See constructor for more information
 *
 * Example usage:
 *
 * ```ts
 * const app = new Application();
 * await app.start();
 * await app.verify();
 * ```
 */
export class Application {
	public readonly cfg: ApplicationConfig;
	public readonly directory: string;

	/** Bento Instance */
	public readonly bento: Bento;
	public readonly vfl: VariableFileLoader;
	public readonly fsel: FSEntityLoader;

	/**
	 * Bento Application is a wrapper for common use case Bootstrap files
	 * It abstracts away the use of built in plugins such as `FSEntityLoader` and `FSVariableLoader`
	 * into an easy to digest Configuration Object. Get up and running even faster then before!
	 *
	 * You can override pretty much everything via the `ApplicationConfig` but here are the defaults:
	 *
	 * - Default Variables File: `../env.example.json` or `env.example.json`
	 * - Variables File: `../env.json` or `./env.json`
	 * - Plugins Directory: `./plugins`
	 * - Components Directory: `./components`
	 *
	 * The above paths will only be used if they actually exist on the filesystem.
	 *
	 * Please note: The relative path is determined by the caller of `new Application();`
	 * If you need a custom relative path / working directory you can pass it via
	 * the 2nd argument. ex: `new Application({}, __dirname);`
	 *
	 * **The above is only relevant if you are using the defaults, if you specify paths in config they must be absolute and won't be prefixed**
	 *
	 * @param cfg ApplicationConfig
	 * @param directory Working directory
	 */
	public constructor(cfg?: ApplicationConfig, directory?: string) {
		this.cfg = cfg || {};
		this.directory = directory || this.getCallerDirectory();

		this.bento = new Bento();

		this.vfl = new VariableFileLoader();
		this.fsel = new FSEntityLoader();

		// Name & Version
		if (this.cfg.name) this.bento.setProperty('APPLICATION_NAME', this.cfg.name);
		if (this.cfg.version) this.bento.setProperty('APPLICATION_VERSION', this.cfg.version);
	}

	protected getCallerDirectory() {
		let callerFile: string = null;
		try {
			const capture: { stack?: string } = {};
			Error.captureStackTrace(capture);
			const splitStack = capture.stack.split('\n');

			// Remove Error header
			splitStack.shift();

			// 0: Call to getCallStack(), 1: Call to getCallerDirectory(), 2: Call to our caller
			const useLine = 2;
			let currentLine = 0;
			while (currentLine < useLine) {
				// If source mapping is enabled some lines with arrows will be added which need to be removed
				if (splitStack[1]?.trimLeft().startsWith('->')) {
					splitStack.shift();
				}

				splitStack.shift();
				currentLine++;
			}

			callerFile = CALLER_LINE_REGEX.exec(splitStack[0])?.[1];
		} catch {
			// Ignore, maybe show a warning
		}

		/* This should never happen but it's handled just in case */
		if (callerFile == null) return null;

		const lastIndex = callerFile.lastIndexOf(path.sep);
		if (lastIndex < 0) return null;

		return callerFile.slice(0, lastIndex);
	}

	protected async exists(location: string | Array<string>) {
		if (Array.isArray(location)) location = path.resolve(...location);

		try {
			await fs.access(location, fsConstants.F_OK);

			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * See JSDoc documentation on constructor for more information.
	 *
	 * **Don't forget to call `Application.verify();` after this**
	 */
	public async start() {
		// add plugins
		if (!this.bento.entities.hasEntity(this.vfl)) await this.bento.addPlugin(this.vfl);
		if (!this.bento.entities.hasEntity(this.fsel)) await this.bento.addPlugin(this.fsel);

		const throwDirectoryError = () => {
			throw new IllegalStateError('Directory not defined and failed to infer via stack.');
		};

		// Default Variables
		let defaults = this.cfg.defaults;
		if (!Array.isArray(defaults)) {
			if (!this.directory) throwDirectoryError();
			defaults = [];

			const defs = [[this.directory, '..', 'env.example.json'], [this.directory, 'env.example.json']];
			for (const def of defs) {
				if (await this.exists(def)) defaults.push(def);
			}
		}

		// Variables
		let variables = this.cfg.variables;
		if (!Array.isArray(variables)) {
			if (!this.directory) throwDirectoryError();
			variables = [];

			const defs = [[this.directory, '..', 'env.json'], [this.directory, 'env.json']];
			for (const def of defs) {
				if (await this.exists(def)) variables.push(def);
			}
		}

		// Plugins
		let plugins = this.cfg.plugins;
		if (!Array.isArray(plugins)) {
			if (!this.directory) throwDirectoryError();
			plugins = [];

			const defs = [[this.directory, 'plugins']];
			for (const def of defs) {
				if (await this.exists(def)) plugins.push(def);
			}
		}

		// Components
		let components = this.cfg.components;
		if (!Array.isArray(components)) {
			if (!this.directory) throwDirectoryError();
			components = [];

			const defs = [[this.directory, 'components']];
			for (const def of defs) {
				if (await this.exists(def)) components.push(def);
			}
		}

		await this.vfl.addFiles(defaults, true);
		await this.vfl.addFiles(variables, false);

		await this.fsel.addDirectories(plugins, EntityType.PLUGIN);
		await this.fsel.addDirectories(components, EntityType.COMPONENT);
	}

	/**
	 * **Always call this**. It does sanity checks and makes sure your applicaton is not in a broken state.
	 *
	 * @returns ApplicationState
	 */
	public async verify(): Promise<ApplicationState> {
		const state = await this.bento.verify();

		const entityFiles = Array.from(this.fsel.files);
		const variableFiles = Array.from(this.vfl.files.keys());

		return { state, entityFiles, variableFiles };
	}
}
