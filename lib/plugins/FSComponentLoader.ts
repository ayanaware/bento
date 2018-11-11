'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError } from '@ayana/errors';

import { ComponentLoadError } from '../errors';
import { Plugin } from '../interfaces';

import { ComponentLoader } from './ComponentLoader';

/**
 * @ignore
 */
const readdir = util.promisify(fs.readdir);
/**
 * @ignore
 */
const stat = util.promisify(fs.stat);

/**
 * @ignore
 * @private
 */
interface DirectoryContent {
	file: string;
	path: string;
	stats: fs.Stats;
}

/**
 * Options for the file system loader
 */
export interface FileSystemLoaderOptions {
	/**
	 * Path to the folder containing primary components
	 */
	primary: string;
	/**
	 * Path to the folder containing secondary components
	 */
	secondary?: string;
}

/**
 * Loads components from the file system
 */
export class FSComponentLoader extends ComponentLoader implements Plugin {

	public readonly name: string;

	private readonly primary: string;
	private readonly secondary: string;

	public constructor(options: FileSystemLoaderOptions) {
		super();
		this.name = 'FSComponentLoader';

		options = options || { primary: null, secondary: null };

		if (typeof options.primary !== 'string') throw new IllegalArgumentError('Path to primary components must be a string');
		if (options.secondary != null && typeof options.secondary !== 'string') throw new IllegalArgumentError('Path to secondary components must be a string');

		this.primary = options.primary;
		this.secondary = options.secondary || null;
	}

	public async onLoad() {
		let primaries;
		try {
			primaries = await this.getComponentFiles(this.primary);
		} catch (e) {
			throw new ComponentLoadError(this.primary, 'Failed to read primary component files').setCause(e);
		}
		await this.createComponents(primaries, true);

		if (this.secondary != null) {
			let secondaries;
			try {
				secondaries = await this.getComponentFiles(this.secondary);
			} catch (e) {
				throw new ComponentLoadError(this.secondary, 'Failed to read secondary component files').setCause(e);
			}
			await this.createComponents(secondaries, false);
		}
	}

	private async createComponents(componentFiles: string[], primary: boolean) {
		for (const component of componentFiles) {
			try {
				let nodeModule: any;
				try {
					nodeModule = require(component);
				} catch (e) {
					throw new ComponentLoadError(component, 'Failed to require module').setCause(e);
				}

				const comp = this.findComponent(nodeModule, component);
				const instance = this.instantiate<any>(comp, component);

				try {
					if (primary) {
						await this.bento.addPrimaryComponent(instance);
					} else {
						await this.bento.addSecondaryComponent(instance);
					}
				} catch (e) {
					throw new ComponentLoadError(component, 'Failed to add component to attached manager').setCause(e);
				}
			} catch (e) {
				if (primary) {
					// Throw the error if we are loading primary components as we have to abort anyway
					throw e;
				} else {
					// TODO Better logging
					console.log(e);
				}
			}
		}
	}

	private async getDirectoryContents(directoryPath: string): Promise<DirectoryContent[]> {
		const results: DirectoryContent[] = [];

		const files = await readdir(directoryPath);

		const statPromises: Promise<fs.Stats>[] = [];
		for (const file of files) {
			const absolute = path.resolve(directoryPath, file);

			results.push({
				file,
				path: absolute,
				stats: null,
			});

			statPromises.push(stat(absolute));
		}

		const stats = await Promise.all(statPromises);
		for (let i = 0; i < stats.length; i++) {
			results[i].stats = stats[i];
		}

		return results;
	}

	private async getDirectoryComponent(directoryPath: string): Promise<string> {
		let contents = await this.getDirectoryContents(directoryPath);
		contents = contents.filter(c => c.stats.isFile() && c.path.endsWith('.js'));

		if (contents.length === 1) return contents[0].path;

		const index = contents.find(c => c.file === 'index.js');
		if (index != null) return index.path;

		return null;
	}

	private async getComponentFiles(root: string): Promise<string[]> {
		const contents = await this.getDirectoryContents(root);

		const components = contents.filter(c => c.file.endsWith('.js') && c.file !== 'index.js').map(c => c.path);

		const directories = contents.filter(c => c.stats.isDirectory());

		const dirCompPromises: Promise<string>[] = [];
		for (const dir of directories) {
			dirCompPromises.push(this.getDirectoryComponent(dir.path));
		}

		return components.concat(await Promise.all(dirCompPromises)).filter(v => v != null);
	}

}
