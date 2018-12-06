'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { IllegalArgumentError, IllegalStateError } from '@ayana/errors';

import { ComponentLoadError } from '../../errors';
import { Plugin } from '../../interfaces';

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
	 * Paths to directoroes containing components
	 */
	directories: string[];
}

/**
 * Loads components from the file system
 */
export class FSComponentLoader extends ComponentLoader implements Plugin {
	public readonly name: string;
	private readonly directories: string[] = [];

	private options: FileSystemLoaderOptions;

	public constructor(options: FileSystemLoaderOptions) {
		super();
		this.name = 'FSComponentLoader';

		options = Object.assign({}, {
			directories: [],
		}, options);

		for (const directory of options.directories) {
			const absolute = path.resolve(directory);
			this.directories.push(absolute);
		}
	}

	public async onLoad() {
		for (const directory of this.directories) {
			const components = await this.getComponentFiles(directory);
			await this.createComponents(components);
		}
	}

	public addDirectory(directory: string) {
		const absolute = path.resolve(directory);
		if (this.directories.indexOf(absolute) > -1) throw new IllegalStateError('This directory is already defined');

		this.directories.push(absolute);
	}

	public removeDirectory(directory: string) {
		const absolute = path.resolve(directory);
		if (this.directories.indexOf(absolute) === -1) throw new IllegalStateError('The requested directory is not loaded');

		// TODO
	}

	private async createComponents(componentFiles: string[]) {
		for (const component of componentFiles) {
			let nodeModule: any;
			try {
				nodeModule = require(component);
			} catch (e) {
				throw new ComponentLoadError(component, 'Failed to require module').setCause(e);
			}

			const comp = this.findComponent(nodeModule, component);
			const instance = this.instantiate<any>(comp, component);

			try {
				await this.bento.addComponent(instance);
			} catch (e) {
				throw new ComponentLoadError(component, 'Failed to add component to attached manager').setCause(e);
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
