'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError } from '@ayana/errors';

import { ComponentLoadError } from '../errors';

import { Loader } from './Loader';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

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
export class FileSystemLoader extends Loader {

	private readonly primary: string;
	private readonly secondary: string;

	public constructor(options: FileSystemLoaderOptions) {
		super();

		options = options || { primary: null, secondary: null };

		if (typeof options.primary !== 'string') throw new IllegalArgumentError('Path to primary components must be a string');
		// TODO: Secondary components are tech optional allow support for this
		if (typeof options.secondary !== 'string') throw new IllegalArgumentError('Path to secondary components must be a string');

		this.primary = options.primary;
		this.secondary = options.secondary;
	}

	public async load() {
		super.load();

		let primaries;
		try {
			primaries = await this.getComponentFiles(this.primary);
		} catch (e) {
			throw new ComponentLoadError(this.primary, 'Failed to read primary component files').setCause(e);
		}

		let secondaries;
		try {
			secondaries = await this.getComponentFiles(this.secondary);
		} catch (e) {
			throw new ComponentLoadError(this.secondary, 'Failed to read secondary component files').setCause(e);
		}

		await this.createComponents(primaries, true);
		await this.createComponents(secondaries, true);

		return true;
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
						await this.manager.addPrimaryComponent(instance);
					} else {
						await this.manager.addSecondaryComponent(instance);
					}
				} catch (e) {
					throw new ComponentLoadError(component, 'Failed to add component to attached manager').setCause(e);
				}
			} catch (e) {
				// TODO Better logging
				console.log(e);
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
